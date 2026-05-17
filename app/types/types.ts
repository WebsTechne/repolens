export type ImportKind = "external" | "local"

export type Import = {
  name: string
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
