"use client"

import { useState, useCallback } from "react"
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useTheme } from "next-themes"
import { getLayoutedElements } from "@/lib/layout"
import { mockEdges, mockNodes } from "@/lib/mock-data"

import { FileNode } from "@/components/graph/file-node"

const nodeTypes = {
  fileNode: FileNode,
}

export default function Graph() {
  const { resolvedTheme } = useTheme()

  if (!resolvedTheme) return null

  const colorMode = resolvedTheme as "light" | "dark"
  return <GraphContent colorMode={colorMode} />
}

function GraphContent({
  colorMode,
}: {
  colorMode: "light" | "dark" | "system" | undefined
}) {
  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    mockNodes,
    mockEdges
  )

  const [nodes, setNodes] = useState(layoutedNodes)
  const [edges, setEdges] = useState(layoutedEdges)

  const onNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  )
  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  )
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  )

  return (
    <div className="h-[calc(100vh-50px)] w-[100vw-18rem] md:w-[100vw-16rem]">
      <ReactFlow
        defaultEdgeOptions={{ type: "straight", animated: true }} // note to team try out smoothstep and default
        nodeTypes={nodeTypes}
        colorMode={colorMode}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />

        <Controls />
        <MiniMap nodeStrokeWidth={3} />
      </ReactFlow>
    </div>
  )
}
