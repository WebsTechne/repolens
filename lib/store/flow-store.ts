import { create } from "zustand"
import { get, set, del } from "idb-keyval"
import type { FlowNode, FlowEdge } from "@/app/types/types"

interface FlowData {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

interface FlowStore {
  nodes: FlowNode[]
  edges: FlowEdge[]
  isHydrated: boolean
  setFlowData: (data: FlowData) => Promise<void>
  clearFlowData: () => Promise<void>
  hasFlowData: () => boolean
}

const STORAGE_KEY = "repolens-flow-data"

export const useFlowStore = create<FlowStore>((setState, getState) => ({
  nodes: [],
  edges: [],
  isHydrated: false,

  setFlowData: async (data: FlowData) => {
    setState({ nodes: data.nodes, edges: data.edges })
    await set(STORAGE_KEY, data)
  },

  clearFlowData: async () => {
    setState({ nodes: [], edges: [] })
    await del(STORAGE_KEY)
  },

  hasFlowData: () => {
    const { nodes } = getState()
    return nodes.length > 0
  },
}))

// Hydrate store from IndexedDB on client side
if (typeof window !== "undefined") {
  get<FlowData>(STORAGE_KEY).then((storedData) => {
    if (storedData && storedData.nodes && storedData.edges) {
      useFlowStore.setState({
        nodes: storedData.nodes,
        edges: storedData.edges,
        isHydrated: true,
      })
    } else {
      useFlowStore.setState({ isHydrated: true })
    }
  })
}

// Made with Bob
