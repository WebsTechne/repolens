// components/graph/FileNode.tsx
"use client"
import { useDetails } from "@/contexts/details-context"
import type { NodeData } from "@/app/types/types"
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

  const importChips = data.imports.flatMap((imp) =>
    imp.names.map((name) => ({
      name,
      kind: imp.kind,
      source: imp.source,
    }))
  )

  const localImportChips = importChips.filter((chip) => chip.kind === "local")
  const externalImportChips = importChips.filter(
    (chip) => chip.kind === "external"
  )

  const localModuleCount = importChips.filter(
    (imp) => imp.kind === "local"
  ).length
  const externalModuleCount = importChips.filter(
    (imp) => imp.kind === "external"
  ).length

  const maxLocalImportChips = localImportChips.slice(0, 4)
  const localRemnant = Math.max(localModuleCount - 4, 0)

  const maxExternalImportChips = externalImportChips.slice(0, 6)
  const externalRemnant = Math.max(externalModuleCount - 6, 0)

  const maxExportChips = data.exports.slice(0, 3)
  const eRemnant = Math.max(data.exports.length - 3, 0)

  return (
    <div
      className={`max-w-55 min-w-52 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm ${selected ? "border-blue-500 ring-1 ring-blue-500" : "border-border"} `}
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

      {(localImportChips.length > 0 || externalImportChips.length > 0) && (
        <div className="mb-1 flex flex-wrap gap-1">
          {maxLocalImportChips.map((chip) => (
            <span
              key={`${chip.source}:${chip.name}`}
              className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {chip.name}
            </span>
          ))}
          {localRemnant > 0 && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              +{localRemnant}
            </span>
          )}
          {maxExternalImportChips.map((chip) => (
            <span
              key={`${chip.source}:${chip.name}`}
              className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              {chip.name}
            </span>
          ))}
          {externalRemnant > 0 && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              +{externalRemnant}
            </span>
          )}
        </div>
      )}

      {data.exports.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {maxExportChips.map((exportName) => (
            <span
              key={exportName}
              className="rounded bg-orange-100 px-1.5 py-0.5 font-mono text-xs text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
            >
              {exportName}
            </span>
          ))}
          {eRemnant > 0 && (
            <span className="rounded bg-orange-100 px-1.5 py-0.5 font-mono text-xs text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
              +{eRemnant}
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
