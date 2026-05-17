// Core data types
export type ImportKind = "external" | "local"

export type Import = {
  source: string // The file path or module name being imported from
  names: string[] // Array of imported names from this source
  kind: ImportKind
}

export type NodeData = {
  filename: string
  path: string
  imports: Import[]
  exports: string[]
}

export type FlowNode = {
  id: string
  type: string
  data: NodeData
}

export type FlowEdge = {
  id: string
  source: string
  target: string
}

// Worker types
export interface CodeFiles {
  [path: string]: string
}

export interface ParseResult {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export interface WorkerMessage {
  codeFiles: CodeFiles
  tsconfigContent?: string
}

export interface WorkerResponse {
  success: boolean
  data?: ParseResult
  error?: string
}

// Server response types
export interface UploadSuccessResponse {
  success: true
  message: string
  fileName: string
  fileSize: string
  filesExtracted: number
  flowData: ParseResult
}

export interface UploadErrorResponse {
  success: false
  error: string
  details?: string
}

export type UploadResponse = UploadSuccessResponse | UploadErrorResponse

// Progress message types
export interface ProgressMessage {
  stage: "extracting" | "parsing" | "complete" | "error"
  message: string
  progress?: number
}

// export type FileTreeItem = {
//   typ
// }

// Made with Bob
