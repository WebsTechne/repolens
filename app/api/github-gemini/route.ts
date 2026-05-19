import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export const runtime = "nodejs"

const MIN_FILE_BYTES = 1 * 1024 * 1024
const MAX_FILE_BYTES = 100 * 1024 * 1024

type RequestBody = {
  owner: string
  repo: string
  filePath: string
  ref?: string
  prompt?: string
  model?: string
}

type GitHubContentsResponse = {
  type: "file"
  sha: string
  size: number
}

type GitHubCommitResponse = {
  commit: {
    tree: {
      sha: string
    }
  }
}

type GitHubTreeEntry = {
  path: string
  type: "blob" | "tree"
  sha: string
  size?: number
}

type GitHubTreeResponse = {
  tree: GitHubTreeEntry[]
  truncated?: boolean
}

const encodeGitHubPath = (filePath: string) =>
  filePath
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

const getGitHubHeaders = (token: string, accept: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: accept,
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "repolens",
})

const readGitHubError = async (response: Response) => {
  try {
    const data = await response.json()
    if (data && typeof data === "object" && "message" in data) {
      return String(data.message)
    }
  } catch {
    return response.statusText
  }

  return response.statusText
}

const fetchGitHubJson = async <T>(url: string, token: string) => {
  const response = await fetch(url, {
    headers: getGitHubHeaders(token, "application/vnd.github+json"),
  })

  if (!response.ok) {
    const message = await readGitHubError(response)
    throw new Error(message)
  }

  return (await response.json()) as T
}

const getMetadataViaContents = async (
  owner: string,
  repo: string,
  filePath: string,
  ref: string,
  token: string
) => {
  const encodedPath = encodeGitHubPath(filePath)
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`
  const response = await fetch(url, {
    headers: getGitHubHeaders(token, "application/vnd.github+json"),
  })

  if (response.ok) {
    const data = (await response.json()) as GitHubContentsResponse
    if (data.type !== "file") {
      throw new Error("Requested path is not a file")
    }

    return { sha: data.sha, size: data.size }
  }

  const message = await readGitHubError(response)
  if (response.status === 403 && message.includes("blobs up to 1 MB")) {
    return null
  }

  throw new Error(message)
}

const getMetadataViaTree = async (
  owner: string,
  repo: string,
  filePath: string,
  ref: string,
  token: string
) => {
  const commit = await fetchGitHubJson<GitHubCommitResponse>(
    `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(ref)}`,
    token
  )

  const treeSha = commit.commit.tree.sha
  const tree = await fetchGitHubJson<GitHubTreeResponse>(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    token
  )

  if (tree.truncated) {
    throw new Error(
      "Repository tree listing was truncated. Provide a more specific ref or path."
    )
  }

  const normalizedPath = filePath.replace(/^\/+/, "")
  const entry = tree.tree.find(
    (item) => item.path === normalizedPath && item.type === "blob"
  )

  if (!entry) {
    throw new Error("File not found in repository tree")
  }

  if (typeof entry.size === "number") {
    return { sha: entry.sha, size: entry.size }
  }

  const blobMeta = await fetchGitHubJson<{ size: number }>(
    `https://api.github.com/repos/${owner}/${repo}/git/blobs/${entry.sha}`,
    token
  )

  return { sha: entry.sha, size: blobMeta.size }
}

const fetchRawBlobContent = async (
  sha: string,
  owner: string,
  repo: string,
  token: string
) => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`,
    {
      headers: getGitHubHeaders(token, "application/vnd.github.raw"),
    }
  )

  if (!response.ok) {
    const message = await readGitHubError(response)
    throw new Error(message)
  }

  return await response.text()
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody
    const owner = body.owner?.trim()
    const repo = body.repo?.trim()
    const filePath = body.filePath?.trim()
    const ref = body.ref?.trim() || "main"
    const prompt = body.prompt?.trim()
    const model = body.model?.trim() || "gemini-2.5-flash"

    if (!owner || !repo || !filePath) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: "owner, repo, and filePath are required",
        },
        { status: 400 }
      )
    }

    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing GITHUB_TOKEN",
          details: "Set GITHUB_TOKEN in your environment",
        },
        { status: 500 }
      )
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing GEMINI_API_KEY",
          details: "Set GEMINI_API_KEY in your environment",
        },
        { status: 500 }
      )
    }

    let metadata = await getMetadataViaContents(
      owner,
      repo,
      filePath,
      ref,
      githubToken
    )

    if (!metadata) {
      metadata = await getMetadataViaTree(
        owner,
        repo,
        filePath,
        ref,
        githubToken
      )
    }

    if (metadata.size < MIN_FILE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "File too small",
          details: "File must be larger than 1 MB",
        },
        { status: 400 }
      )
    }

    if (metadata.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "File too large",
          details: "File must be smaller than 100 MB",
        },
        { status: 400 }
      )
    }

    const fileContent = await fetchRawBlobContent(
      metadata.sha,
      owner,
      repo,
      githubToken
    )

    const ai = new GoogleGenAI({ apiKey: geminiApiKey })
    const combinedPrompt = `${prompt || "Analyze the following file content."}\n\nRepo: ${owner}/${repo}\nRef: ${ref}\nPath: ${filePath}\n\n${fileContent}`

    const geminiResponse = await ai.models.generateContent({
      model,
      contents: combinedPrompt,
    })

    return NextResponse.json({
      success: true,
      github: {
        owner,
        repo,
        path: filePath.replace(/^\/+/, ""),
        ref,
        sizeBytes: metadata.size,
      },
      gemini: {
        model,
        text: geminiResponse.text ?? "",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[github-gemini] 500:", message, error) // add this
    return NextResponse.json(
      {
        success: false,
        error: "Request failed",
        details: message,
      },
      { status: 500 }
    )
  }
}
