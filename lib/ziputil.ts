import JSZip from "jszip"

type ZipInput = Blob | File | ArrayBuffer

interface CodeFiles {
  [path: string]: string
}

export async function unzipGitHubCodeFiles(
  zipData: ZipInput
): Promise<CodeFiles> {
  const zip = new JSZip()
  const contents: CodeFiles = {}

  const unzipped = await zip.loadAsync(zipData)

  // Allowed extensions regex
  const codeExtensionRegex = /\.(js|jsx|ts|tsx)$/i

  const promises: Promise<void>[] = Object.entries(unzipped.files).map(
    async ([relativePath, file]): Promise<void> => {
      // 1. Skip directories and non-code asset files
      if (file.dir || !codeExtensionRegex.test(relativePath)) return

      // 2. Clean GitHub's root directory wrapper
      const pathParts = relativePath.split("/")
      pathParts.shift()
      const cleanPath = pathParts.join("/")

      // Skip if path becomes empty after removing root
      if (!cleanPath) return

      // 3. Read file content
      const textContent = await file.async("string")

      // Unique paths mean "src/utils/index.ts" and "src/types/index.ts" co-exist perfectly
      contents[cleanPath] = textContent
    }
  )

  await Promise.all(promises)
  return contents
}
