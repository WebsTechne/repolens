"use client"

import { useDetails } from "@/contexts/details-context"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { mockNodes, type NodeData } from "@/lib/mock-data"
import { useEffect, useState } from "react"
import { ScrollArea } from "./ui/scroll-area"
import Image from "next/image"

export function DetailsPanel() {
  const { detailsOpen, toggleDetails } = useDetails()
  const [currentHash, setCurrentHash] = useState("")
  const [nodeData, setNodeData] = useState<NodeData | null>(null)

  const [aiMode, setAiMode] = useState(false)

  // Track hash changes
  useEffect(() => {
    const updateHash = () => {
      const hash = window.location.hash.slice(1) // Remove the # prefix
      setCurrentHash(hash)

      // Find matching node data
      if (hash) {
        const matchingNode = mockNodes.find((node) => node.data.path === hash)
        setNodeData(matchingNode?.data || null)
      } else {
        setNodeData(null)
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
  }, [])

  return (
    <section
      className={cn(
        "fixed top-0 z-1020 h-dvh w-75/100 max-w-[384px] border-l bg-card py-4 shadow-2xs duration-250",
        detailsOpen
          ? "pointer-events-auto right-0 opacity-100"
          : "pointer-events-none -right-25 opacity-0"
      )}
    >
      <ScrollArea className="h-full [&_.section]:mb-4 [&_.section]:px-4">
        <div className="section flex-between gap-0.5">
          <h2 className="text-xl font-semibold">Details</h2>
          <Button size="icon-lg" variant="ghost" onClick={toggleDetails}>
            <HugeiconsIcon icon={Cancel01Icon} />
          </Button>
        </div>

        <div className="section">
          {nodeData ? (
            <div className="space-y-4">
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
              {nodeData.deps.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Dependencies ({nodeData.deps.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {nodeData.deps.map((dep) => (
                      <span
                        key={dep}
                        className="rounded-md bg-blue-100 px-2 py-1 font-mono text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        // bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400
                      >
                        {dep}
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
          ) : (
            <div className="flex h-[calc(100%-4rem)] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select a file to view details
              </p>
            </div>
          )}
        </div>

        <div
          className={cn(
            "mx-2 overflow-clip rounded-lg border bg-background p-3 duration-230",
            aiMode ? "h-60" : "h-18"
          )}
        >
          <div
            className="flex-between cursor-pointer"
            onClick={() => setAiMode(!aiMode)}
          >
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
          </div>
        </div>
      </ScrollArea>
    </section>
  )
}
