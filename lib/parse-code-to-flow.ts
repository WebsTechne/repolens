import path from "path" // Native Node module works perfectly on server-side workers
import { Project, SourceFile } from "ts-morph"
import type { FlowNode, FlowEdge, NodeData, Import } from "@/app/types/types"

interface CodeFiles {
  [path: string]: string
}

interface ParseResult {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

/**
 * Parses code files using ts-morph and generates React Flow nodes and edges
 * @param codeFiles - Object mapping file paths to their content
 * @param tsconfigContent - Optional tsconfig.json content for path resolution
 * @returns React Flow nodes and edges
 */
export function parseCodeToFlow(
  codeFiles: CodeFiles,
  tsconfigContent?: string
): ParseResult {
  // Create an In-Memory ts-morph project
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // ESNext
      module: 99, // ESNext
      moduleResolution: 2, // Node
      esModuleInterop: true,
      allowJs: true,
      jsx: 4, // React JSX
    },
  })

  // Parse tsconfig if provided to extract path mappings
  let pathMappings: Record<string, string[]> = {}
  let baseUrl = "."

  if (tsconfigContent) {
    try {
      const tsconfig = JSON.parse(tsconfigContent)
      if (tsconfig.compilerOptions?.paths) {
        pathMappings = tsconfig.compilerOptions.paths
      }
      if (tsconfig.compilerOptions?.baseUrl) {
        baseUrl = tsconfig.compilerOptions.baseUrl
      }
    } catch (error) {
      console.warn("Failed to parse tsconfig:", error)
    }
  }

  // Add all unzipped memory files to the virtual project space
  const sourceFiles: Map<string, SourceFile> = new Map()
  for (const [filePath, content] of Object.entries(codeFiles)) {
    const sourceFile = project.createSourceFile(filePath, content, {
      overwrite: true,
    })
    sourceFiles.set(filePath, sourceFile)
  }

  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []
  const edgeSet = new Set<string>() // Track unique edge paths

  // Process each source file node
  for (const [filePath, sourceFile] of sourceFiles) {
    const nodeData = extractNodeData(
      sourceFile,
      filePath,
      pathMappings,
      baseUrl,
      codeFiles
    )

    // Create the visual React Flow node frame
    const node: FlowNode = {
      id: filePath,
      type: "custom",
      data: nodeData,
    }
    nodes.push(node)

    // Create connected dependency edges for all discovered local imports
    for (const imp of nodeData.imports) {
      if (imp.kind === "local") {
        const edgeId = `${filePath}->${imp.name}`
        if (!edgeSet.has(edgeId)) {
          edges.push({
            id: edgeId,
            source: filePath,
            target: imp.name,
          })
          edgeSet.add(edgeId)
        }
      }
    }
  }

  return { nodes, edges }
}

/**
 * Extracts dependency node metadata and module exports from a source file
 */
function extractNodeData(
  sourceFile: SourceFile,
  filePath: string,
  pathMappings: Record<string, string[]>,
  baseUrl: string,
  allFiles: CodeFiles
): NodeData {
  const imports: Import[] = []
  const exports: string[] = []

  // 1. Process and resolve file imports
  const importDeclarations = sourceFile.getImportDeclarations()
  for (const importDecl of importDeclarations) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue()

    // Resolve the internal system path
    const resolvedPath = resolveImportPath(
      moduleSpecifier,
      filePath,
      pathMappings,
      baseUrl,
      allFiles
    )

    const kind: "external" | "local" = resolvedPath ? "local" : "external"

    imports.push({
      name: resolvedPath || moduleSpecifier,
      kind,
    })
  }

  // 2. Extract explicitly declared module exports
  // Named exports (e.g., export { a, b })
  const exportDeclarations = sourceFile.getExportDeclarations()
  for (const exportDecl of exportDeclarations) {
    const namedExports = exportDecl.getNamedExports()
    for (const namedExport of namedExports) {
      exports.push(namedExport.getName())
    }
  }

  // Export assignments (e.g., export default, export =)
  const exportAssignments = sourceFile.getExportAssignments()
  for (const exportAssignment of exportAssignments) {
    if (exportAssignment.isExportEquals()) {
      exports.push("= (export equals)")
    } else {
      exports.push("default")
    }
  }

  // Explicit inline exported functions
  sourceFile.getFunctions().forEach((func) => {
    if (func.isExported()) {
      exports.push(func.getName() || "anonymous")
    }
  })

  // Explicit inline exported classes
  sourceFile.getClasses().forEach((cls) => {
    if (cls.isExported()) {
      exports.push(cls.getName() || "anonymous")
    }
  })

  // Explicit inline exported variables
  sourceFile.getVariableStatements().forEach((varStatement) => {
    if (varStatement.isExported()) {
      varStatement.getDeclarations().forEach((decl) => {
        exports.push(decl.getName())
      })
    }
  })

  // Explicit inline exported interfaces
  sourceFile.getInterfaces().forEach((iface) => {
    if (iface.isExported()) {
      exports.push(iface.getName())
    }
  })

  // Explicit inline exported type aliases
  sourceFile.getTypeAliases().forEach((typeAlias) => {
    if (typeAlias.isExported()) {
      exports.push(typeAlias.getName())
    }
  })

  // Explicit inline exported enums
  sourceFile.getEnums().forEach((enumDecl) => {
    if (enumDecl.isExported()) {
      exports.push(enumDecl.getName())
    }
  })

  const filename = filePath.split("/").pop() || filePath

  return {
    filename,
    path: filePath,
    imports,
    exports: [...new Set(exports)], // Dedup duplicate entries safely
  }
}

/**
 * Resolves an abstract import path or path alias down to an actual exact memory file key
 */
function resolveImportPath(
  importPath: string,
  currentFilePath: string,
  pathMappings: Record<string, string[]>,
  baseUrl: string,
  allFiles: CodeFiles
): string | null {
  let targetPath = importPath
  const isRelative = importPath.startsWith(".") || importPath.startsWith("/")

  // 1. Resolve path alias mappings (e.g., '@/components/*')
  if (!isRelative) {
    let matched = false
    for (const [alias, paths] of Object.entries(pathMappings)) {
      const aliasPattern = alias.replace("/*", "")
      if (importPath.startsWith(aliasPattern)) {
        const relativeSuffix = importPath.substring(aliasPattern.length)

        for (const mappedPath of paths) {
          const resolvedMapping = mappedPath
            .replace("/*", "")
            .replace("*", relativeSuffix)

          // Clean up standard leading dots from tsconfig base dirs safely
          const baseDir = baseUrl.replace(/^\.\/?/, "")
          targetPath = path.join(baseDir, resolvedMapping)
          matched = true
          break
        }
      }
      if (matched) break
    }

    // If it did not match an alias structure and isn't relative, it's a standard node_module
    if (!matched) return null
  } else {
    // 2. Resolve standard relative lookups safely using path.dirname
    const currentDir = path.dirname(currentFilePath)
    targetPath = path.join(currentDir, importPath)
  }

  // 3. Normalize structural noise ('..', '.', double slashes) out of the path string
  // and force forward-slashes to ensure compatibility with your unzipped dictionary format
  const normalizedTarget = path.normalize(targetPath).replace(/\\/g, "/")

  // 4. Check potential file resolution candidates sequentially
  const candidates = [
    normalizedTarget,
    `${normalizedTarget}.ts`,
    `${normalizedTarget}.tsx`,
    `${normalizedTarget}.js`,
    `${normalizedTarget}.jsx`,
    `${normalizedTarget}/index.ts`,
    `${normalizedTarget}/index.tsx`,
    `${normalizedTarget}/index.js`,
    `${normalizedTarget}/index.jsx`,
  ]

  for (const candidate of candidates) {
    if (allFiles[candidate]) {
      return candidate
    }
  }

  return null
}
