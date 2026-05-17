import { parentPort } from "worker_threads"
import { parseCodeToFlow } from "./parse-code-to-flow"

interface WorkerMessage {
  codeFiles: Record<string, string>
  tsconfigContent?: string
}

// Listen for messages from the main thread
parentPort?.on("message", (message: WorkerMessage) => {
  try {
    const { codeFiles, tsconfigContent } = message

    // Parse code files using ts-morph
    const result = parseCodeToFlow(codeFiles, tsconfigContent)

    // Send result back to main thread
    parentPort?.postMessage({ success: true, data: result })
  } catch (error) {
    parentPort?.postMessage({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

// Made with Bob
