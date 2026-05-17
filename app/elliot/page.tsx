"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFlowStore } from "@/lib/store/flow-store"
import { useRepoStore } from "@/lib/store/repo-store"

const Page = () => {
  const { nodes, edges, isHydrated, setFlowData, clearFlowData, hasFlowData } =
    useFlowStore()
  const {
    username,
    repoName,
    branchName,
    setUsername,
    setRepoName,
    setBranchName,
  } = useRepoStore()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    const validZipTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ]

    if (
      selectedFile &&
      (validZipTypes.includes(selectedFile.type) ||
        selectedFile.name.endsWith(".zip"))
    ) {
      setFile(selectedFile)
      setMessage("")
    } else {
      setFile(null)
      setMessage("Please select a valid ZIP file")
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first")
      return
    }

    setUploading(true)
    setMessage("")

    try {
      // Send file to server for processing
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Log full data to console for inspection
        console.log("=== FLOW DATA RECEIVED FROM SERVER ===")
        console.log("Nodes:", data.flowData.nodes)
        console.log("Edges:", data.flowData.edges)
        console.log("File Tree:", data.fileTree)
        console.log("======================================")

        // Save to store and IndexedDB
        await setFlowData(data.flowData)

        setMessage(
          `Success: ${data.message} - ${data.flowData.nodes.length} nodes, ${data.flowData.edges.length} edges`
        )
        setFile(null)

        // Reset file input
        const fileInput = document.getElementById("file") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      } else {
        setMessage(`Error: ${data.error || "Upload failed"}`)
      }
    } catch (error) {
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Upload failed"}`
      )
    } finally {
      setUploading(false)
    }
  }

  const handleClearData = async () => {
    await clearFlowData()
    setMessage("Flow data cleared")
  }

  // Show loading state while hydrating from IndexedDB
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Loading...</h1>
            <p className="text-sm text-muted-foreground">
              Checking for existing data
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show flow data view if data exists
  if (hasFlowData()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6 rounded-lg border p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Flow Data Loaded</h1>
            <p className="text-sm text-muted-foreground">
              {nodes.length} node{nodes.length > 1 ? "s" : ""} and{" "}
              {edges.length} edge{edges.length > 1 ? "s" : ""} in storage
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Nodes</h2>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-4">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    <div className="font-mono font-semibold">
                      {node.data.filename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {node.data.path}
                    </div>
                    <div className="mt-1 flex gap-4 text-xs">
                      <span>
                        Imports: {node.data.imports.length} (
                        {
                          node.data.imports.filter(
                            (imp: { kind: string }) => imp.kind === "external"
                          ).length
                        }{" "}
                        ext,{" "}
                        {
                          node.data.imports.filter(
                            (imp: { kind: string }) => imp.kind === "local"
                          ).length
                        }{" "}
                        local)
                      </span>
                      <span>Exports: {node.data.exports.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Edges</h2>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-4">
                {edges.length > 0 ? (
                  edges.map((edge) => (
                    <div
                      key={edge.id}
                      className="rounded-md bg-muted/50 px-3 py-1.5 font-mono text-xs"
                    >
                      {edge.source} → {edge.target}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No edges (no local imports found)
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleClearData}
            variant="destructive"
            className="w-full"
          >
            Clear Data
          </Button>
        </div>
      </div>
    )
  }

  // Show upload UI if no data exists
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Upload ZIP File</h1>
          <p className="text-sm text-muted-foreground">
            Select a GitHub repository ZIP file to analyze
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">GitHub Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="octocat"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repoName">Repository Name</Label>
            <Input
              id="repoName"
              type="text"
              placeholder="my-repo"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchName">Branch Name</Label>
            <Input
              id="branchName"
              type="text"
              placeholder="main"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">ZIP File</Label>
            <Input
              id="file"
              type="file"
              accept=".zip,application/x-zip-compressed"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {file && (
            <div className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? "Processing on server..." : "Upload & Analyze"}
          </Button>

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.startsWith("Success")
                  ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                  : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Page

// Made with Bob
