import path from "path"
import { Project, SourceFile, SyntaxKind } from "ts-morph"
import type { CompilerOptions } from "ts-morph"
import type {
  FlowNode,
  FlowEdge,
  NodeData,
  Import,
  CodeFiles,
  ParseResult,
} from "../app/types/types.js"

/**
 * Parses code files using ts-morph and generates React Flow nodes and edges
 * @param codeFiles - Object mapping file paths to their content
 * @param tsconfigContent - Optional tsconfig.json content for path resolution
 * @returns React Flow nodes and edges representing the code structure
 */
export function parseCodeToFlow(
  codeFiles: CodeFiles,
  tsconfigContent?: string
): ParseResult {
  let compilerOptions: CompilerOptions = {
    target: 99, // ESNext
    module: 99, // ESNext
    moduleResolution: 2, // Node
    esModuleInterop: true,
    allowJs: true,
    jsx: 4, // React JSX
  }

  let pathMappings: Record<string, string[]> = {}
  let baseUrl = "."

  // Parse tsconfig and use its compiler options
  if (tsconfigContent) {
    try {
      const tsconfig = JSON.parse(tsconfigContent)

      if (tsconfig.compilerOptions) {
        // Use tsconfig compiler options
        compilerOptions = {
          ...compilerOptions,
          ...tsconfig.compilerOptions,
        }
        console.log(
          "[Parser] Using tsconfig.json compiler options for ts-morph project"
        )

        if (tsconfig.compilerOptions.paths) {
          pathMappings = tsconfig.compilerOptions.paths
        }
        if (tsconfig.compilerOptions.baseUrl) {
          baseUrl = tsconfig.compilerOptions.baseUrl
        }
      }
    } catch (error) {
      console.warn(
        "[Parser] Failed to parse tsconfig.json, falling back to default compiler options:",
        error instanceof Error ? error.message : "Unknown error"
      )
    }
  } else {
    console.warn(
      "[Parser] No tsconfig.json provided, using default compiler options"
    )
  }

  // Create in-memory ts-morph project
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions,
  })

  // Add all files to the virtual project
  const sourceFiles: Map<string, SourceFile> = new Map()
  for (const filePath of Object.keys(codeFiles)) {
    const content = codeFiles[filePath]
    const sourceFile = project.createSourceFile(filePath, content, {
      overwrite: true,
    })
    sourceFiles.set(filePath, sourceFile)
  }

  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []
  const edgeSet = new Set<string>()

  // Process each file to create nodes and edges
  for (const [filePath, sourceFile] of sourceFiles) {
    const nodeData = extractNodeData(
      sourceFile,
      filePath,
      pathMappings,
      baseUrl,
      codeFiles,
      sourceFiles
    )

    nodes.push({
      id: filePath,
      type: "custom",
      data: nodeData,
    })

    // Create edges for local imports
    for (const imp of nodeData.imports) {
      if (imp.kind === "local") {
        const edgeId = `${filePath}->${imp.source}`
        if (!edgeSet.has(edgeId)) {
          edges.push({
            id: edgeId,
            source: filePath,
            target: imp.source,
          })
          edgeSet.add(edgeId)
        }
      }
    }
  }

  console.log(
    `[Parser] Successfully parsed ${nodes.length} files with ${edges.length} dependencies`
  )

  return { nodes, edges }
}

/**
 * Extracts imports and exports from a source file
 */
function extractNodeData(
  sourceFile: SourceFile,
  filePath: string,
  pathMappings: Record<string, string[]>,
  baseUrl: string,
  allFiles: CodeFiles,
  allSourceFiles: Map<string, SourceFile>
): NodeData {
  const exports: string[] = []

  // Group imports by source path
  const importsBySource = new Map<
    string,
    { names: string[]; kind: "external" | "local" }
  >()

  // Extract imports with function names
  const importDeclarations = sourceFile.getImportDeclarations()
  for (const importDecl of importDeclarations) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue()

    const resolvedPath = resolveImportPath(
      moduleSpecifier,
      filePath,
      pathMappings,
      baseUrl,
      allFiles
    )

    const kind: "external" | "local" = resolvedPath ? "local" : "external"
    const source = resolvedPath || moduleSpecifier

    // Get or create the import group for this source
    if (!importsBySource.has(source)) {
      importsBySource.set(source, { names: [], kind })
    }
    const importGroup = importsBySource.get(source)!

    // Extract imported names (functions, classes, etc.)
    const namedImports = importDecl.getNamedImports()
    const defaultImport = importDecl.getDefaultImport()
    const namespaceImport = importDecl.getNamespaceImport()

    if (namedImports.length > 0) {
      // Named imports: import { foo, bar } from 'module'
      for (const namedImport of namedImports) {
        importGroup.names.push(namedImport.getName())
      }
    } else if (defaultImport) {
      // Default import: import Foo from 'module'
      const importedName = defaultImport.getText()

      // For local imports, try to get the actual exported name
      if (kind === "local" && resolvedPath) {
        const targetSourceFile = allSourceFiles.get(resolvedPath)
        if (targetSourceFile) {
          const actualDefaultExport = getDefaultExportName(targetSourceFile)
          importGroup.names.push(actualDefaultExport || importedName)
        } else {
          importGroup.names.push(importedName)
        }
      } else {
        importGroup.names.push(importedName)
      }
    } else if (namespaceImport) {
      // Namespace import: import * as Foo from 'module'
      importGroup.names.push(namespaceImport.getText())
    } else {
      // Side-effect import: import 'module'
      importGroup.names.push("(side-effect)")
    }
  }

  // Convert grouped imports to Import array
  const imports: Import[] = Array.from(importsBySource.entries()).map(
    ([source, { names, kind }]) => ({
      source,
      names,
      kind,
    })
  )

  // Extract named exports
  const exportDeclarations = sourceFile.getExportDeclarations()
  for (const exportDecl of exportDeclarations) {
    const namedExports = exportDecl.getNamedExports()
    for (const namedExport of namedExports) {
      exports.push(namedExport.getName())
    }
  }

  // Extract default export with actual name
  const exportAssignments = sourceFile.getExportAssignments()
  for (const exportAssignment of exportAssignments) {
    if (exportAssignment.isExportEquals()) {
      exports.push("= (export equals)")
    } else {
      // Get the actual default export name
      const defaultExportName = getDefaultExportName(sourceFile)
      exports.push(defaultExportName)
    }
  }

  // Extract exported functions
  sourceFile.getFunctions().forEach((func) => {
    if (func.isExported()) {
      exports.push(func.getName() || "anonymous")
    }
  })

  // Extract exported classes
  sourceFile.getClasses().forEach((cls) => {
    if (cls.isExported()) {
      exports.push(cls.getName() || "anonymous")
    }
  })

  // Extract exported variables
  sourceFile.getVariableStatements().forEach((varStatement) => {
    if (varStatement.isExported()) {
      varStatement.getDeclarations().forEach((decl) => {
        exports.push(decl.getName())
      })
    }
  })

  // Extract exported interfaces
  sourceFile.getInterfaces().forEach((iface) => {
    if (iface.isExported()) {
      exports.push(iface.getName())
    }
  })

  // Extract exported type aliases
  sourceFile.getTypeAliases().forEach((typeAlias) => {
    if (typeAlias.isExported()) {
      exports.push(typeAlias.getName())
    }
  })

  // Extract exported enums
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
    exports: [...new Set(exports)],
  }
}

/**
 * Gets the actual name of the default export
 */
function getDefaultExportName(sourceFile: SourceFile): string {
  // Check for export default function/class with name
  const defaultExportSymbol = sourceFile.getDefaultExportSymbol()
  if (defaultExportSymbol) {
    const name = defaultExportSymbol.getName()
    if (name !== "default") {
      return name
    }
  }

  // Check for export default [identifier]
  const exportAssignments = sourceFile.getExportAssignments()
  for (const assignment of exportAssignments) {
    if (!assignment.isExportEquals()) {
      const expression = assignment.getExpression()
      if (expression) {
        // Try to get identifier name
        if (expression.getKind() === SyntaxKind.Identifier) {
          return expression.getText()
        }
        // Try to get function/class name
        const text = expression.getText()
        const match = text.match(/^(?:function|class)\s+(\w+)/)
        if (match) {
          return match[1]
        }
      }
    }
  }

  return "default"
}

/**
 * Resolves import path to actual file path
 * Handles path aliases (e.g., @/*) and relative imports
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

  if (!isRelative) {
    // Try to resolve path alias (e.g., @/components)
    let matched = false

    for (const [alias, paths] of Object.entries(pathMappings)) {
      // Handle wildcard aliases (e.g., "@/*")
      if (alias.endsWith("/*")) {
        const aliasPattern = alias.slice(0, -1) // Keep the slash! "@/*" becomes "@/"

        if (importPath.startsWith(aliasPattern)) {
          // Extract everything after the "@/" (e.g., "components/Button")
          const relativeSuffix = importPath.substring(aliasPattern.length)

          for (const mappedPath of paths) {
            // Replace the target wildcard token with the suffix string
            const resolvedMapping = mappedPath.replace("*", relativeSuffix)
            const baseDir = baseUrl.replace(/^\.\/?/, "")

            targetPath = path.join(baseDir, resolvedMapping)
            matched = true
            break
          }
        }
      }
      // Handle exact keyword aliases (e.g., "components" -> "src/components")
      else if (importPath === alias || importPath.startsWith(`${alias}/`)) {
        const relativeSuffix = importPath.substring(alias.length) // e.g. "/Button" or ""

        for (const mappedPath of paths) {
          const baseDir = baseUrl.replace(/^\.\/?/, "")
          targetPath = path.join(baseDir, mappedPath, relativeSuffix)
          matched = true
          break
        }
      }

      if (matched) {
        console.log(
          `[Parser] Resolved alias: "${importPath}" -> "${targetPath}"`
        )
        break
      }
    }

    // External module (node_modules) - safe from scope collisions now
    if (!matched) {
      console.log(`[Parser] External module detected: "${importPath}"`)
      return null
    }
  } else {
    // Resolve relative import
    const currentDir = path.dirname(currentFilePath)
    targetPath = path.join(currentDir, importPath)
  }

  // Normalize path and convert to forward slashes
  const normalizedTarget = path.normalize(targetPath).replace(/\\/g, "/")

  // Try different file extensions
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
      console.log(`[Parser] Found file: "${candidate}"`)
      return candidate
    }
  }

  console.log(
    `[Parser] File not found. Tried: ${candidates.slice(0, 3).join(", ")}...`
  )
  return null
}

// Made with Bob
