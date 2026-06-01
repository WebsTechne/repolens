import type { FileTree, FolderTreeItem, CodeFiles } from "@/app/types/types"

/**
 * Builds a hierarchical file tree from flat file paths
 * @param codeFiles - Object mapping file paths to their content
 * @returns Root folder containing the entire file tree
 */
export function buildFileTree(codeFiles: CodeFiles): FileTree {
  const root: FolderTreeItem = {
    type: "folder",
    name: "root",
    path: "",
    isExpanded: true,
    children: [],
  }

  // Sort file paths for consistent ordering
  const sortedPaths = Object.keys(codeFiles).sort()

  for (const filePath of sortedPaths) {
    addPathToTree(root, filePath)
  }

  return root
}

/**
 * Adds a file path to the tree structure
 */
function addPathToTree(root: FolderTreeItem, filePath: string): void {
  const parts = filePath.split("/").filter((part) => part.length > 0)
  let currentFolder = root

  // Navigate/create folder structure
  for (let i = 0; i < parts.length - 1; i++) {
    const folderName = parts[i]
    const folderPath = parts.slice(0, i + 1).join("/")

    // Find existing folder or create new one
    let folder = currentFolder.children.find(
      (child) => child.type === "folder" && child.name === folderName
    ) as FolderTreeItem | undefined

    if (!folder) {
      folder = {
        type: "folder",
        name: folderName,
        path: folderPath,
        isExpanded: false,
        children: [],
      }
      currentFolder.children.push(folder)
    }

    currentFolder = folder
  }

  // Add the file
  const fileName = parts[parts.length - 1]
  currentFolder.children.push({
    type: "file",
    name: fileName,
    path: filePath,
  })
}
