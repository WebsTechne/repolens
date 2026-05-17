import { parentPort } from "worker_threads"
import { parseCodeToFlow } from "./parse-code-to-flow.ts"
import type { WorkerMessage, WorkerResponse } from "@/app/types/types"

/**
 * Worker thread for parsing code files with ts-morph
 * Runs in a separate thread to avoid blocking the main Next.js server
 */

if (!parentPort) {
  throw new Error("Must be executed in a worker_threads context")
}

parentPort.on("message", (message: WorkerMessage) => {
  if (!parentPort) {
    throw new Error("Must be executed in a worker_threads context")
  }

  try {
    console.log("[Worker] Starting code parsing...")
    const { codeFiles, tsconfigContent } = message
    const result = parseCodeToFlow(codeFiles, tsconfigContent)

    console.log(
      `[Worker] Parsing complete: ${result.nodes.length} nodes, ${result.edges.length} edges`
    )

    const response: WorkerResponse = { success: true, data: result }
    parentPort.postMessage(response)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown parsing error"
    console.error("[Worker] Parsing failed:", errorMessage)

    const response: WorkerResponse = {
      success: false,
      error: errorMessage,
    }
    parentPort.postMessage(response)
  }
})

// Made with Bob
