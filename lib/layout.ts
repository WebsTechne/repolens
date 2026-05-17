import dagre from "@dagrejs/dagre"
import type { FlowNode, FlowEdge } from "@/app/types/types"

const NODE_WIDTH = 208 // matches your w-52 card
const NODE_HEIGHT = 80 // approximate card height

export function getLayoutedElements(nodes: FlowNode[], edges: FlowEdge[]) {
  const g = new dagre.graphlib.Graph()

  g.setGraph({
    rankdir: "TB", // top-to-bottom — change to "LR" for left-right
    ranksep: 80, // vertical gap between ranks
    nodesep: 40, // horizontal gap between nodes
    ranker: "tight-tree", // alternatives: "network-simplex" (default), "longest-path"
  })

  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const { x, y } = g.node(node.id)
    return {
      ...node,
      position: {
        x: x - NODE_WIDTH / 2, // dagre gives center coords, RF wants top-left
        y: y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}
