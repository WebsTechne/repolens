"use client"

import { useState, useCallback, useMemo, useSyncExternalStore } from "react"
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  NodeChange,
  EdgeChange,
  Connection,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useTheme } from "next-themes"
import { getLayoutedElements } from "@/lib/layout"
import { useFlowStore } from "@/lib/store/flow-store"

import { FileNode } from "@/components/graph/file-node"

const nodeTypes = {
  fileNode: FileNode,
  custom: FileNode,
}

export default function Graph({ minimapOn }: { minimapOn: boolean }) {
  const { resolvedTheme } = useTheme()
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!isClient) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">Loading graph...</p>
      </div>
    )
  }

  const colorMode = (resolvedTheme || "light") as "light" | "dark"
  return <GraphContent colorMode={colorMode} minimapOn={minimapOn} />
}

function GraphContent({
  colorMode,
  minimapOn,
}: {
  colorMode: "light" | "dark" | "system" | undefined
  minimapOn: boolean
}) {
  const { nodes: storeNodes, edges: storeEdges, isHydrated } = useFlowStore()

  // Apply layout to nodes and edges directly from store
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (storeNodes.length === 0) {
      return { nodes: [], edges: [] }
    }
    return getLayoutedElements(storeNodes, storeEdges)
  }, [storeNodes, storeEdges])

  const [nodes, setNodes] = useState(layoutedNodes)

  const [edges, setEdges] = useState(layoutedEdges)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes(
        (nodesSnapshot) =>
          applyNodeChanges(changes, nodesSnapshot) as typeof nodesSnapshot
      ),
    []
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges(
        (edgesSnapshot) =>
          applyEdgeChanges(changes, edgesSnapshot) as typeof edgesSnapshot
      ),
    []
  )
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(
        (edgesSnapshot) =>
          addEdge(params, edgesSnapshot) as typeof edgesSnapshot
      ),
    []
  )

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">Loading graph data...</p>
      </div>
    )
  }

  // Show empty state if no data
  if (layoutedNodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">No data to display</p>
          <p className="text-sm text-muted-foreground">
            Upload a repository to visualize its structure
          </p>
        </div>
      </div>
    )
  }

  return (
    <ReactFlow
      defaultEdgeOptions={{ type: "straight", animated: true }}
      nodeTypes={nodeTypes}
      colorMode={colorMode}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      key={`${layoutedNodes.length}-${layoutedEdges.length}`}
    >
      <Background variant={BackgroundVariant.Dots} />

      <Controls />
      {minimapOn && <MiniMap nodeStrokeWidth={3} />}
    </ReactFlow>
  )
}

// Made with Bob
