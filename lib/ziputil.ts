import JSZip from "jszip"

type ZipInput = Blob | File | ArrayBuffer

interface CodeFiles {
  [path: string]: string
}

export interface UnzippedGitHubRepo {
  codeFiles: CodeFiles
  tsconfigContent?: string
}

export async function unzipGitHubCodeFiles(
  zipData: ZipInput
): Promise<UnzippedGitHubRepo> {
  const zip = new JSZip()
  const contents: CodeFiles = {}
  let tsconfigContent: string | undefined

  const unzipped = await zip.loadAsync(zipData)

  // Allowed extensions regex
  const codeExtensionRegex = /\.(js|jsx|ts|tsx)$/i

  const promises: Promise<void>[] = Object.entries(unzipped.files).map(
    async ([relativePath, file]): Promise<void> => {
      // 1. Skip directories
      if (file.dir) return

      // 2. Clean GitHub's root directory wrapper
      const pathParts = relativePath.split("/")
      pathParts.shift()
      const cleanPath = pathParts.join("/")

      // Skip if path becomes empty after removing root
      if (!cleanPath) return

      // 3. Capture root tsconfig.json before filtering out non-code files
      if (cleanPath === "tsconfig.json") {
        tsconfigContent = await file.async("string")
        return
      }

      // 4. Skip non-code asset files
      if (!codeExtensionRegex.test(cleanPath)) return

      // 5. Read file content
      const textContent = await file.async("string")

      // Unique paths mean "src/utils/index.ts" and "src/types/index.ts" co-exist perfectly
      contents[cleanPath] = textContent
    }
  )

  await Promise.all(promises)
  return { codeFiles: contents, tsconfigContent }
}
