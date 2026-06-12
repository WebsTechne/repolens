import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

type RequestBody = {
  owner: string
  repo: string
  filePath: string
  ref?: string
  prompt?: string
  model?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody
    const owner = body.owner?.trim()
    const repo = body.repo?.trim()
    const filePath = body.filePath?.trim()
    const ref = body.ref?.trim() || "HEAD"
    const prompt = body.prompt?.trim()
    const model = body.model?.trim() || "gemini-3.1-flash-lite"

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

    const query = `
    query {
      repository(owner:"${owner}",name:"${repo}") {
        object(expression: "${ref}:${filePath}"){
          ...on Blob {
            text
          }
        }
      }
    }
      `

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
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })

    const result = await response.json()

    //Extract text
    const fileContent = result.data?.repository?.object?.text
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

    const ai = new GoogleGenAI({ apiKey: geminiApiKey })
    const combinedPrompt = `${prompt || "Analyze the following file content."}\n\nRepo: ${owner}/${repo}\nRef: ${ref}\nPath: ${filePath}\n\n ${fileContent}`

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
