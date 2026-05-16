// components/graph/FileNode.tsx
"use client"
import { useDetails } from "@/contexts/details-context"
import { NodeData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Handle, Position } from "@xyflow/react"
import { useRouter } from "next/navigation"

export function FileNode({
  data,
  selected,
}: {
  data: NodeData
  selected: boolean
}) {
  const router = useRouter()
  const { setDetailsOpen } = useDetails()

  return (
    <div
      className={`w-52 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm ${selected ? "border-blue-500 ring-1 ring-blue-500" : "border-border"} `}
      onClick={() => {
        router.push(`#${data.path}`)
        setDetailsOpen(true)
      }}
    >
      <Handle type="target" position={Position.Top} />

      <p className="truncate font-mono font-medium text-foreground">
        {data.filename}
      </p>
      <p className="mb-2 truncate font-mono text-xs text-muted-foreground">
        {data.path}
      </p>

      {data.imports.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {data.imports.map((i) => (
            <span
              key={i.name}
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-xs",
                i.kind === "external"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              )}
            >
              {i.name}
            </span>
          ))}
        </div>
      )}

      {data.exports.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.exports.map((e) => (
            <span
              key={e}
              className="rounded bg-orange-100 px-1.5 py-0.5 font-mono text-xs text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
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
