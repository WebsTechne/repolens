"use client"

import { useDetails } from "@/contexts/details-context"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { useQuery } from "@tanstack/react-query"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useFlowStore } from "@/lib/store/flow-store"
import { useRepoStore } from "@/lib/store/repo-store"
import type { NodeData } from "@/app/types/types"
import { useEffect, useState } from "react"
import { ScrollArea } from "./ui/scroll-area"
import Image from "next/image"
import { Switch } from "./ui/switch"
import { Skeleton } from "./ui/skeleton"
import { marked } from "marked"
import DOMPurify from "dompurify"

export function DetailsPanel() {
  const { detailsOpen, toggleDetails } = useDetails()
  const { nodes } = useFlowStore()
  const { username, repoName, branchName } = useRepoStore()
  const [currentHash, setCurrentHash] = useState("")
  const [nodeData, setNodeData] = useState<NodeData>({
    filename: "",
    path: "",
    imports: [],
    exports: [],
  })

  const [aiMode, setAiMode] = useState(false)
  const resolvedRef = branchName || "HEAD"

  const aiSummaryQuery = useQuery({
    queryKey: ["ai-summary", username, repoName, resolvedRef, nodeData?.path],
    enabled: Boolean(aiMode && nodeData?.path && username && repoName),
    queryFn: async () => {
      const response = await fetch("/api/github-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: username,
          repo: repoName,
          filePath: nodeData.path,
          ref: resolvedRef,
          prompt:
            "Provide a concise summary of this file, including its responsibility and key exports.",
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.details || data?.error || "Failed to load summary"
        )
      }

      return data.gemini?.text || ""
    },
  })

  const exit = () => {
    toggleDetails()
    setAiMode(false)
  }

  // Track hash changes
  useEffect(() => {
    const defaultNode = {
      filename: "",
      path: "",
      imports: [],
      exports: [],
    }
    const updateHash = () => {
      const hash = window.location.hash.slice(1) // Remove the # prefix
      setCurrentHash(hash)

      // Find matching node data
      if (hash) {
        const matchingNode = nodes.find((node) => node.data.path === hash)
        setNodeData(matchingNode?.data || defaultNode)
      } else {
        setNodeData(defaultNode)
      }
    }

    // Set initial hash
    updateHash()

    // Listen for hash changes (browser back/forward)
    window.addEventListener("hashchange", updateHash)

    // Poll for hash changes (for Next.js Link clicks that don't trigger hashchange)
    const interval = setInterval(updateHash, 100)

    return () => {
      window.removeEventListener("hashchange", updateHash)
      clearInterval(interval)
    }
  }, [nodes])

  // Imports and exports chip

  const importChips = nodeData.imports.flatMap((imp) =>
    imp.names.map((name) => ({
      name,
      kind: imp.kind,
      source: imp.source,
    }))
  )
  const localImports = importChips.filter((imp) => imp.kind === "local")
  const externalImports = importChips.filter((imp) => imp.kind === "external")

  return (
    <section
      className={cn(
        "fixed top-0 z-1020 h-dvh w-75/100 max-w-[384px] border-l bg-card py-4 shadow-2xs duration-250",
        detailsOpen
          ? "pointer-events-auto right-0 opacity-100"
          : "pointer-events-none -right-25 opacity-0"
      )}
    >
      <ScrollArea className="relative h-full [&_.section]:mb-4 [&_.section]:px-4">
        <div className="section sticky top-0 flex-between gap-0.5 bg-card">
          <h2 className="text-xl font-semibold">Details</h2>
          <Button size="icon-lg" variant="ghost" onClick={exit}>
            <HugeiconsIcon icon={Cancel01Icon} />
          </Button>
        </div>

        <div className="section">
          <div className="space-y-4">
            <>
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                  Filename
                </h3>
                <p className="font-mono text-sm">{nodeData.filename}</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                  Path
                </h3>
                <p className="font-mono text-sm break-all">{nodeData.path}</p>
              </div>
            </>
            {localImports.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Local Imports ({localImports.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {localImports.map((imp, idx) => (
                    <span
                      key={`${imp.source}-${idx}`}
                      className="rounded-md bg-blue-100 px-2 py-1 font-mono text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {imp.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {externalImports.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Node Modules ({externalImports.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {externalImports.map((imp, idx) => (
                    <span
                      key={`${imp.source}-${idx}`}
                      className="rounded-md bg-emerald-100 px-2 py-1 font-mono text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                    >
                      {imp.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {nodeData.exports.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Exports ({nodeData.exports.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {nodeData.exports.map((exp) => (
                    <span
                      key={exp}
                      className="rounded-md bg-orange-100 px-2 py-1 font-mono text-xs text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {nodeData && (
          <div
            className={cn(
              "mx-2 rounded-lg border bg-background p-3 duration-230",
              aiMode ? "h-60 overflow-y-scroll" : "h-18 overflow-clip"
            )}
          >
            <div
              className="mb-1 flex-between cursor-pointer"
              onClick={() => setAiMode(!aiMode)}
            >
              <div className="flex-between gap-2">
                <span className="flex-center size-12 rounded-full">
                  <span className="relative inline-block size-10 overflow-clip rounded-full">
                    <Image
                      src="/ibm-bob-300x258.png"
                      alt="IBM Bob logo"
                      fill={true}
                      className="object-cover select-none"
                    />
                  </span>
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    aiMode ? "text-sidebar-primary" : "text-muted-foreground"
                  )}
                >
                  AI Summary
                </span>
              </div>

              <Switch checked={aiMode} onCheckedChange={setAiMode} />
            </div>

            {aiMode ? (
              aiSummaryQuery.isPending ? (
                <div className="flex flex-col gap-1.5 py-2">
                  <Skeleton className="h-4 w-9/10 rounded-sm" />
                  <Skeleton className="h-4 w-7/10 rounded-sm" />
                  <Skeleton className="h-4 w-5/10 rounded-sm" /> <br />
                  <Skeleton className="h-4 w-8/10 rounded-sm" />
                  <Skeleton className="h-4 w-6/10 rounded-sm" />
                </div>
              ) : aiSummaryQuery.isError ? (
                <p className="text-sm text-destructive">
                  {aiSummaryQuery.error instanceof Error
                    ? aiSummaryQuery.error.message
                    : "Failed to load summary"}
                </p>
              ) : (
                <div
                  className="text-sm leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      marked.parse(
                        aiSummaryQuery.data ||
                          "No summary available for this file."
                      ) as string
                    ),
                  }}
                ></div>
              )
            ) : (
              <></>
            )}
          </div>
        )}
      </ScrollArea>
    </section>
  )
}

// Made with Bob
