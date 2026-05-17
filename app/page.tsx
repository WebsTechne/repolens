"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFlowStore } from "@/lib/store/flow-store"
import { useRepoStore } from "@/lib/store/repo-store"

export default function Page() {
  const router = useRouter()
  const { isHydrated, setFlowData, clearFlowData, hasFlowData } = useFlowStore()
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

  // Redirect to project page if data exists
  useEffect(() => {
    if (isHydrated && hasFlowData() && username && repoName) {
      const slug = `${username}-${repoName}`
      router.push(`/projects/${slug}`)
    }
  }, [isHydrated, hasFlowData, username, repoName, router])

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

    if (!username || !repoName) {
      setMessage("Please enter username and repository name")
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

        // Save to store and IndexedDB (including fileTree)
        await setFlowData({
          nodes: data.flowData.nodes,
          edges: data.flowData.edges,
          fileTree: data.fileTree,
        })

        setMessage(
          `Success: ${data.message} - ${data.flowData.nodes.length} nodes, ${data.flowData.edges.length} edges`
        )

        // Redirect to project page
        const slug = `${username}-${repoName}`
        router.push(`/projects/${slug}`)
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

  // Show upload UI
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">RepoLens</h1>
          <p className="text-sm text-muted-foreground">
            Upload a GitHub repository ZIP file to visualize its structure
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
            disabled={!file || uploading || !username || !repoName}
            className="w-full"
          >
            {uploading ? "Processing..." : "Upload & Analyze"}
          </Button>

          {hasFlowData() && (
            <Button
              onClick={handleClearData}
              variant="outline"
              className="w-full"
            >
              Clear Existing Data
            </Button>
          )}

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

// Made with Bob
