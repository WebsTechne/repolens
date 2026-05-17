import { parentPort } from "worker_threads"
import { parseCodeToFlow } from "./parse-code-to-flow.ts"

// 1. Defend the runtime context
if (!parentPort) {
  throw new Error(
    "This script must be executed inside a Node.js worker_threads pool."
  )
}

interface WorkerMessage {
  codeFiles: Record<string, string>
  tsconfigContent?: string
}

// Listen for messages from the main thread
parentPort.on("message", (message: WorkerMessage) => {
  // 2. Safe to remove optional chain '?' here now
  if (!parentPort) {
    throw new Error(
      "This script must be executed inside a Node.js worker_threads pool."
    )
  }

  try {
    const { codeFiles, tsconfigContent } = message

    const result = parseCodeToFlow(codeFiles, tsconfigContent)

    parentPort.postMessage({ success: true, data: result }) // Safe to remove optional chain
  } catch (error) {
    parentPort.postMessage({
      // Safe to remove optional chain
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})
