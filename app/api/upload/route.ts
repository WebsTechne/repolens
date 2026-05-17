import { NextRequest, NextResponse } from "next/server"
import { Worker } from "worker_threads"
import { unzipGitHubCodeFiles } from "@/lib/ziputil"
import path from "path"
import type { FlowNode, FlowEdge } from "@/app/types/types"

interface ParseResult {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

interface WorkerResponse {
  success: boolean
  data?: ParseResult
  error?: string
}

/**
 * Run ts-morph parsing in a worker thread to avoid blocking
 */

export function parseInWorker(
  codeFiles: Record<string, string>,
  tsconfigContent?: string
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    // Resolve the path to the compiled JavaScript worker file
    // 1. Target your raw TypeScript worker file directly
    const workerPath = path.join(process.cwd(), "lib", "parse-worker.ts")

    // 2. Spawn the worker, telling Node to use 'tsx' to execute the TypeScript
    const worker = new Worker(workerPath, {
      execArgv: ["--import", "tsx"], // 👈 This interprets your .ts file instantly on the backend
    })

    // Node.js Event Listeners (Use .on instead of .onmessage)
    worker.on("message", (response: WorkerResponse) => {
      if (response.success && response.data) {
        resolve(response.data)
      } else {
        reject(new Error(response.error || "Worker failed"))
      }
      worker.terminate()
    })

    worker.on("error", (error) => {
      reject(error)
      worker.terminate()
    })

    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })

    // Send data to Node worker thread
    worker.postMessage({ codeFiles, tsconfigContent })
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validZipTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ]

    if (!validZipTypes.includes(file.type) && !file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Invalid file type. Only ZIP files are allowed" },
        { status: 400 }
      )
    }

    // Get file size
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
    console.log(`[Server] Received ZIP file: ${file.name} (${fileSizeMB} MB)`)

    // Step 1: Extract code files from ZIP (server-side)
    let codeFiles: Record<string, string>
    let fileCount = 0

    try {
      const arrayBuffer = await file.arrayBuffer()
      codeFiles = await unzipGitHubCodeFiles(arrayBuffer)
      fileCount = Object.keys(codeFiles).length

      console.log(`[Server] Extracted ${fileCount} code files from ZIP`)
    } catch (zipError) {
      console.error("[Server] ZIP extraction error:", zipError)
      return NextResponse.json(
        {
          error: "Failed to extract ZIP file",
          details:
            zipError instanceof Error ? zipError.message : "Unknown error",
        },
        { status: 400 }
      )
    }

    // Validate that we found code files
    if (fileCount === 0) {
      return NextResponse.json(
        {
          error: "No code files found in ZIP",
          details: "ZIP must contain .js, .jsx, .ts, or .tsx files",
        },
        { status: 400 }
      )
    }

    // Step 2: Parse code files with ts-morph in worker thread (server-side)
    let flowData: ParseResult

    try {
      console.log(`[Server] Starting ts-morph parsing in worker thread...`)
      flowData = await parseInWorker(codeFiles)
      console.log(
        `[Server] Parsing complete: ${flowData.nodes.length} nodes, ${flowData.edges.length} edges`
      )
    } catch (parseError) {
      console.error("[Server] Parsing error:", parseError)
      return NextResponse.json(
        {
          error: "Failed to parse code files",
          details:
            parseError instanceof Error ? parseError.message : "Unknown error",
        },
        { status: 500 }
      )
    }

    // Return processed data to client
    return NextResponse.json({
      success: true,
      message: "File processed successfully",
      fileName: file.name,
      fileSize: fileSizeMB + " MB",
      filesExtracted: fileCount,
      flowData: {
        nodes: flowData.nodes,
        edges: flowData.edges,
      },
    })
  } catch (error) {
    console.error("[Server] Upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to process upload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Made with Bob
