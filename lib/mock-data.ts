// types you'll want defined
type NodeData = {
  filename: string
  path: string
  exports: string[]
  deps: string[] // node_modules this file uses
}

type FlowNode = {
  id: string // use the full file path as ID
  position: { x: number; y: number } // you position these manually or with a layout algo
  type: string
  data: NodeData
}

type FlowEdge = {
  id: string // just "source->target" works
  source: string // node id
  target: string // node id
}

export type { NodeData, FlowNode, FlowEdge }

export const mockNodes: FlowNode[] = [
  {
    id: "src/app/page.tsx",
    position: { x: 250, y: 50 },
    type: "fileNode",
    data: {
      filename: "page.tsx",
      path: "src/app/page.tsx",
      exports: ["default"],
      deps: [],
    },
  },
  {
    id: "src/app/layout.tsx",
    position: { x: 50, y: 50 },
    type: "fileNode",
    data: {
      filename: "layout.tsx",
      path: "src/app/layout.tsx",
      exports: ["default"],
      deps: ["next/font"],
    },
  },
  {
    id: "src/utils/auth.ts",
    position: { x: 150, y: 200 },
    type: "fileNode",
    data: {
      filename: "auth.ts",
      path: "src/utils/auth.ts",
      exports: ["verifyToken", "generateJWT"],
      deps: ["jsonwebtoken", "bcrypt"],
    },
  },
  {
    id: "src/utils/api.ts",
    position: { x: 350, y: 200 },
    type: "fileNode",
    data: {
      filename: "api.ts",
      path: "src/utils/api.ts",
      exports: ["fetcher", "postJSON", "handleError"],
      deps: ["axios"],
    },
  },
  {
    id: "src/hooks/useAuth.ts",
    position: { x: 50, y: 350 },
    type: "fileNode",
    data: {
      filename: "useAuth.ts",
      path: "src/hooks/useAuth.ts",
      exports: ["useAuth"],
      deps: ["zustand"],
    },
  },
  {
    id: "src/hooks/useForm.ts",
    position: { x: 250, y: 350 },
    type: "fileNode",
    data: {
      filename: "useForm.ts",
      path: "src/hooks/useForm.ts",
      exports: ["useForm", "useField"],
      deps: [],
    },
  },
  {
    id: "src/components/Button.tsx",
    position: { x: 50, y: 500 },
    type: "fileNode",
    data: {
      filename: "Button.tsx",
      path: "src/components/Button.tsx",
      exports: ["Button"],
      deps: [],
    },
  },
  {
    id: "src/components/Modal.tsx",
    position: { x: 250, y: 500 },
    type: "fileNode",
    data: {
      filename: "Modal.tsx",
      path: "src/components/Modal.tsx",
      exports: ["Modal"],
      deps: ["@radix-ui/react-dialog"],
    },
  },
  {
    id: "src/types/index.ts",
    position: { x: 450, y: 350 },
    type: "fileNode",
    data: {
      filename: "index.ts",
      path: "src/types/index.ts",
      exports: ["User", "AuthToken", "ApiResponse", "FormState"],
      deps: [],
    },
  },
]

export const mockEdges = [
  // entry points import utils
  { id: "e1", source: "src/app/page.tsx", target: "src/utils/auth.ts" },
  { id: "e2", source: "src/app/page.tsx", target: "src/utils/api.ts" },
  { id: "e3", source: "src/app/layout.tsx", target: "src/utils/auth.ts" },

  // utils import hooks
  { id: "e4", source: "src/utils/auth.ts", target: "src/hooks/useAuth.ts" },
  { id: "e5", source: "src/utils/api.ts", target: "src/hooks/useForm.ts" },

  // hooks import components
  {
    id: "e6",
    source: "src/hooks/useAuth.ts",
    target: "src/components/Button.tsx",
  },
  {
    id: "e7",
    source: "src/hooks/useForm.ts",
    target: "src/components/Modal.tsx",
  },

  // types is a shared leaf — everything points to it, nothing out
  { id: "e8", source: "src/utils/auth.ts", target: "src/types/index.ts" },
  { id: "e9", source: "src/utils/api.ts", target: "src/types/index.ts" },
  { id: "e10", source: "src/hooks/useAuth.ts", target: "src/types/index.ts" },
]
