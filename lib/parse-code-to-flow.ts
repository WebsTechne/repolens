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
  // Create a ts-morph project
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

  // Parse tsconfig if provided to get path mappings
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

  // Add all files to the project
  const sourceFiles: Map<string, SourceFile> = new Map()
  for (const [filePath, content] of Object.entries(codeFiles)) {
    const sourceFile = project.createSourceFile(filePath, content, {
      overwrite: true,
    })
    sourceFiles.set(filePath, sourceFile)
  }

  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []
  const edgeSet = new Set<string>() // Track unique edges

  // Process each file
  for (const [filePath, sourceFile] of sourceFiles) {
    const nodeData = extractNodeData(
      sourceFile,
      filePath,
      pathMappings,
      baseUrl,
      codeFiles
    )

    // Create node
    const node: FlowNode = {
      id: filePath,
      type: "custom",
      data: nodeData,
    }
    nodes.push(node)

    // Create edges for local imports
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
 * Extracts node data from a source file
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

  // Extract imports
  const importDeclarations = sourceFile.getImportDeclarations()
  for (const importDecl of importDeclarations) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue()

    // Resolve the import path
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

  // Extract exports
  // Named exports
  const exportDeclarations = sourceFile.getExportDeclarations()
  for (const exportDecl of exportDeclarations) {
    const namedExports = exportDecl.getNamedExports()
    for (const namedExport of namedExports) {
      exports.push(namedExport.getName())
    }
  }

  // Export assignments (export default, export =)
  const exportAssignments = sourceFile.getExportAssignments()
  for (const exportAssignment of exportAssignments) {
    if (exportAssignment.isExportEquals()) {
      exports.push("= (export equals)")
    } else {
      exports.push("default")
    }
  }

  // Exported functions
  sourceFile.getFunctions().forEach((func) => {
    if (func.isExported()) {
      exports.push(func.getName() || "anonymous")
    }
  })

  // Exported classes
  sourceFile.getClasses().forEach((cls) => {
    if (cls.isExported()) {
      exports.push(cls.getName() || "anonymous")
    }
  })

  // Exported variables
  sourceFile.getVariableStatements().forEach((varStatement) => {
    if (varStatement.isExported()) {
      varStatement.getDeclarations().forEach((decl) => {
        exports.push(decl.getName())
      })
    }
  })

  // Exported interfaces
  sourceFile.getInterfaces().forEach((iface) => {
    if (iface.isExported()) {
      exports.push(iface.getName())
    }
  })

  // Exported type aliases
  sourceFile.getTypeAliases().forEach((typeAlias) => {
    if (typeAlias.isExported()) {
      exports.push(typeAlias.getName())
    }
  })

  // Exported enums
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
    exports: [...new Set(exports)], // Remove duplicates
  }
}

/**
 * Resolves an import path to an actual file path
 */
function resolveImportPath(
  importPath: string,
  currentFilePath: string,
  pathMappings: Record<string, string[]>,
  baseUrl: string,
  allFiles: CodeFiles
): string | null {
  // External module (node_modules)
  if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
    // Check if it matches a path alias
    for (const [alias, paths] of Object.entries(pathMappings)) {
      const aliasPattern = alias.replace("/*", "")
      if (importPath.startsWith(aliasPattern)) {
        const relativePath = importPath.substring(aliasPattern.length)
        for (const mappedPath of paths) {
          const resolvedPath = mappedPath
            .replace("/*", "")
            .replace("*", relativePath)

          // Try to find the file with various extensions
          const candidates = [
            resolvedPath,
            `${resolvedPath}.ts`,
            `${resolvedPath}.tsx`,
            `${resolvedPath}.js`,
            `${resolvedPath}.jsx`,
            `${resolvedPath}/index.ts`,
            `${resolvedPath}/index.tsx`,
            `${resolvedPath}/index.js`,
            `${resolvedPath}/index.jsx`,
          ]

          for (const candidate of candidates) {
            if (allFiles[candidate]) {
              return candidate
            }
          }
        }
      }
    }
    // Not a local file
    return null
  }

  // Relative import
  const currentDir = currentFilePath.split("/").slice(0, -1).join("/")
  let resolvedPath = importPath

  if (importPath.startsWith(".")) {
    // Resolve relative path
    const parts = currentDir.split("/")
    const importParts = importPath.split("/")

    for (const part of importParts) {
      if (part === "..") {
        parts.pop()
      } else if (part !== ".") {
        parts.push(part)
      }
    }

    resolvedPath = parts.join("/")
  }

  // Try to find the file with various extensions
  const candidates = [
    resolvedPath,
    `${resolvedPath}.ts`,
    `${resolvedPath}.tsx`,
    `${resolvedPath}.js`,
    `${resolvedPath}.jsx`,
    `${resolvedPath}/index.ts`,
    `${resolvedPath}/index.tsx`,
    `${resolvedPath}/index.js`,
    `${resolvedPath}/index.jsx`,
  ]

  for (const candidate of candidates) {
    if (allFiles[candidate]) {
      return candidate
    }
  }

  return null
}

// Made with Bob
