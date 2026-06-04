import { NextRequest, NextResponse } from "next/server"
import { Worker } from "worker_threads"
import { unzipGitHubCodeFiles } from "@/lib/ziputil"
import { buildFileTree } from "@/lib/build-file-tree"
import path from "path"

export const runtime = "nodejs"
import type {
  ParseResult,
  WorkerResponse,
  UploadResponse,
  CodeFiles,
} from "@/app/types/types"

/**
 * Runs ts-morph parsing in a worker thread to avoid blocking the main server
 * Uses tsx to execute TypeScript directly in the worker
 */
function parseInWorker(
  codeFiles: CodeFiles,
  tsconfigContent?: string
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    // Point directly at the TS worker file
    const workerPath = path.join(
      process.cwd(),
      "worker-dist",
      "lib",
      "parse-worker.js"
    )

    const worker = new Worker(workerPath)

    worker.on("message", (response: WorkerResponse) => {
      if (response.success && response.data) {
        resolve(response.data)
      } else {
        const error = new Error(
          response.error || "Worker failed without error message"
        )
        console.error("[Server] Worker error:", error.message)
        reject(error)
      }
      worker.terminate()
    })

    worker.on("error", (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown worker error"
      console.error("[Server] Worker thread error:", errorMessage)
      reject(error)
      worker.terminate()
    })

    worker.on("exit", (code) => {
      if (code !== 0) {
        const error = new Error(`Worker stopped with exit code ${code}`)
        console.error("[Server] Worker exit error:", error.message)
        reject(error)
      }
    })

    worker.postMessage({ codeFiles, tsconfigContent })
  })
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      console.error("[Server] No file provided in request")
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
          details: "Please upload a ZIP file",
        },
        { status: 400 }
      )
    }

    // Validate ZIP file type
    const validZipTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ]

    if (!validZipTypes.includes(file.type) && !file.name.endsWith(".zip")) {
      console.error(
        `[Server] Invalid file type: ${file.type}, name: ${file.name}`
      )
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type",
          details: "Only ZIP files are allowed",
        },
        { status: 400 }
      )
    }

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
    console.log(`[Server] Received ZIP file: ${file.name} (${fileSizeMB} MB)`)

    // Extract code files from ZIP
    let codeFiles: CodeFiles
    let tsconfigContent: string | undefined
    let fileCount = 0

    try {
      console.log("[Server] Extracting files from ZIP...")
      const arrayBuffer = await file.arrayBuffer()
      const extracted = await unzipGitHubCodeFiles(arrayBuffer)
      codeFiles = extracted.codeFiles
      tsconfigContent = extracted.tsconfigContent
      fileCount = Object.keys(codeFiles).length

      console.log(`[Server] Successfully extracted ${fileCount} code files`)
      if (tsconfigContent) {
        console.log("[Server] Found root tsconfig.json in ZIP")
      }
    } catch (zipError) {
      const errorMessage =
        zipError instanceof Error ? zipError.message : "Unknown ZIP error"
      console.error("[Server] ZIP extraction failed:", errorMessage)

      return NextResponse.json(
        {
          success: false,
          error: "Failed to extract ZIP file",
          details: errorMessage,
        },
        { status: 400 }
      )
    }

    if (fileCount === 0) {
      console.error("[Server] No code files found in ZIP")
      return NextResponse.json(
        {
          success: false,
          error: "No code files found in ZIP",
          details: "ZIP must contain .js, .jsx, .ts, or .tsx files",
        },
        { status: 400 }
      )
    }

    // Parse code files with ts-morph in worker thread
    let flowData: ParseResult

    try {
      console.log("[Server] Starting code parsing in worker thread...")
      flowData = await parseInWorker(codeFiles, tsconfigContent)
      console.log(
        `[Server] Parsing complete: ${flowData.nodes.length} nodes, ${flowData.edges.length} edges`
      )
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error ? parseError.message : "Unknown parse error"
      console.error("[Server] Code parsing failed:", errorMessage)

      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse code files",
          details: errorMessage,
        },
        { status: 500 }
      )
    }

    // Build file tree
    const fileTree = buildFileTree(codeFiles)
    console.log(
      "[Server] Built file tree with",
      fileTree.children.length,
      "items"
    )

    // Return success response
    console.log("[Server] Upload and parsing completed successfully")
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
      fileTree,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown server error"
    console.error("[Server] Unexpected upload error:", errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process upload",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

// Made with Bob
