// types you'll want defined
type ImportKind = "external" | "local"

type Import = {
  name: string
  kind: ImportKind
}

type NodeData = {
  filename: string
  path: string
  imports: Import[] // replaces deps
  exports: string[]
}

type FlowNode = {
  id: string // use the full file path as ID
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
    type: "fileNode",
    data: {
      filename: "page.tsx",
      path: "src/app/page.tsx",
      imports: [],
      exports: ["default"],
    },
  },
  {
    id: "src/app/layout.tsx",
    type: "fileNode",
    data: {
      filename: "layout.tsx",
      path: "src/app/layout.tsx",
      imports: [
        { name: "next/font", kind: "external" },
        { name: "../components/Button", kind: "local" },
      ],
      exports: ["default"],
    },
  },
  {
    id: "src/utils/auth.ts",
    type: "fileNode",
    data: {
      filename: "auth.ts",
      path: "src/utils/auth.ts",
      imports: [
        { name: "jsonwebtoken", kind: "external" },
        { name: "bcrypt", kind: "external" },
        { name: "../types/index", kind: "local" },
      ],
      exports: ["verifyToken", "generateJWT"],
    },
  },
  {
    id: "src/utils/api.ts",
    type: "fileNode",
    data: {
      filename: "api.ts",
      path: "src/utils/api.ts",
      imports: [
        { name: "axios", kind: "external" },
        { name: "../types/index", kind: "local" },
      ],
      exports: ["fetcher", "postJSON", "handleError"],
    },
  },
  {
    id: "src/hooks/useAuth.ts",
    type: "fileNode",
    data: {
      filename: "useAuth.ts",
      path: "src/hooks/useAuth.ts",
      imports: [
        { name: "zustand", kind: "external" },
        { name: "../utils/auth", kind: "local" },
        { name: "../types/index", kind: "local" },
      ],
      exports: ["useAuth"],
    },
  },
  {
    id: "src/hooks/useForm.ts",
    type: "fileNode",
    data: {
      filename: "useForm.ts",
      path: "src/hooks/useForm.ts",
      imports: [{ name: "../types/index", kind: "local" }],
      exports: ["useForm", "useField"],
    },
  },
  {
    id: "src/components/Button.tsx",
    type: "fileNode",
    data: {
      filename: "Button.tsx",
      path: "src/components/Button.tsx",
      imports: [],
      exports: ["Button"],
    },
  },
  {
    id: "src/components/Modal.tsx",
    type: "fileNode",
    data: {
      filename: "Modal.tsx",
      path: "src/components/Modal.tsx",
      imports: [
        { name: "@radix-ui/react-dialog", kind: "external" },
        { name: "./Button", kind: "local" },
        { name: "../hooks/useForm", kind: "local" },
      ],
      exports: ["Modal"],
    },
  },
  {
    id: "src/types/index.ts",
    type: "fileNode",
    data: {
      filename: "index.ts",
      path: "src/types/index.ts",
      imports: [],
      exports: ["User", "AuthToken", "ApiResponse", "FormState"],
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
