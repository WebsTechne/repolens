// components/graph/FileNode.tsx
"use client"
import { Handle, Position } from "@xyflow/react"
import { useRouter } from "next/navigation"

type FileNodeData = {
  filename: string
  path: string
  exports: string[]
  deps: string[]
}

export function FileNode({
  data,
  selected,
}: {
  data: FileNodeData
  selected: boolean
}) {
  const router = useRouter()

  return (
    <div
      className={`w-52 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm ${selected ? "border-blue-500 ring-1 ring-blue-500" : "border-border"} `}
      onClick={() => router.push(`#${data.path}`)}
    >
      <Handle type="target" position={Position.Top} />

      <p className="truncate font-mono font-medium text-foreground">
        {data.filename}
      </p>
      <p className="mb-2 truncate font-mono text-xs text-muted-foreground">
        {data.path}
      </p>

      {data.deps.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {data.deps.map((d) => (
            <span
              key={d}
              className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {data.exports.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.exports.map((e) => (
            <span
              key={e}
              className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              {e}
            </span>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
