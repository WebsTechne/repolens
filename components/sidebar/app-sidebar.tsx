"use client"

export const getProject = (slug: string) => {
  let project: { slug: string; name: string; error?: "" } = {
    slug: "",
    name: "",
  }
  const raw = localStorage.getItem(slug)
  if (!raw) return { ...project, error: "Project not found" }

  project = JSON.parse(raw)

  return project
}

import { ComponentProps, useState, useEffect } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ChevronDown,
  Folder01Icon,
  Folder02Icon,
  Folder03Icon,
  File02Icon,
} from "@hugeicons/core-free-icons"
import { SearchForm } from "./search-form"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible"
import { Switch } from "../ui/switch"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "../ui/field"
import { useDetails } from "@/contexts/details-context"

// ============================================================================
// FILE TREE TYPES & DATA STRUCTURE
// ============================================================================

/**
 * Represents a file in the tree
 * @property type - Discriminator to identify this as a file
 * @property name - Display name of the file (e.g., "index.tsx")
 * @property path - Full path to the file (e.g., "components/graph/index.tsx")
 */
type FileTreeItem = {
  type: "file"
  name: string
  path: string
}

/**
 * Represents a folder in the tree
 * @property type - Discriminator to identify this as a folder
 * @property name - Display name of the folder (e.g., "graph")
 * @property path - Full path to the folder (e.g., "components/graph")
 * @property isExpanded - Optional UI state for collapsible folders
 * @property children - Array of nested files and folders
 */
type FolderTreeItem = {
  type: "folder"
  name: string
  path: string
  isExpanded?: boolean
  children: TreeItem[]
}

/**
 * Union type representing any item in the file tree
 * Use the 'type' property to discriminate between files and folders
 */
type TreeItem = FileTreeItem | FolderTreeItem

/**
 * Root of the file tree
 */
type FileTree = FolderTreeItem

const fileTree: FileTree = {
  type: "folder",
  name: "components",
  path: "components",
  isExpanded: true,
  children: [
    {
      type: "folder",
      name: "graph",
      path: "components/graph",
      isExpanded: true,
      children: [
        {
          type: "file",
          name: "file-node.tsx",
          path: "components/graph/file-node.tsx",
        },
        {
          type: "file",
          name: "index.tsx",
          path: "components/graph/index.tsx",
        },
        {
          type: "folder",
          name: "utils",
          path: "components/graph/utils",
          isExpanded: false,
          children: [
            {
              type: "file",
              name: "helpers.ts",
              path: "components/graph/utils/helpers.ts",
            },
            {
              type: "file",
              name: "constants.ts",
              path: "components/graph/utils/constants.ts",
            },
          ],
        },
      ],
    },
    {
      type: "folder",
      name: "sidebar",
      path: "components/sidebar",
      isExpanded: false,
      children: [
        {
          type: "file",
          name: "app-sidebar.tsx",
          path: "components/sidebar/app-sidebar.tsx",
        },
        {
          type: "file",
          name: "search-form.tsx",
          path: "components/sidebar/search-form.tsx",
        },
      ],
    },
    {
      type: "folder",
      name: "ui",
      path: "components/ui",
      isExpanded: false,
      children: [
        {
          type: "file",
          name: ".gitkeep",
          path: "components/ui/.gitkeep",
        },
        {
          type: "file",
          name: "app-header.tsx",
          path: "components/ui/app-header.tsx",
        },
        {
          type: "file",
          name: "base-node.tsx",
          path: "components/ui/base-node.tsx",
        },
        {
          type: "file",
          name: "theme-provider.tsx",
          path: "components/ui/theme-provider.tsx",
        },
      ],
    },
    {
      type: "file",
      name: "index.html",
      path: "components/index.html",
    },
    {
      type: "file",
      name: "styles.css",
      path: "components/styles.css",
    },
    {
      type: "file",
      name: "script.js",
      path: "components/script.js",
    },
  ],
}

/**
 * Recursive component to render file tree items
 * - Files: Renders as SidebarMenuItem with SidebarMenuButton
 * - Folders: Renders as Collapsible with nested TreeNode calls for children
 */
function TreeNode({
  item,
  depth = 0,
  currentHash,
  onHashChange,
}: {
  item: TreeItem
  depth?: number
  currentHash: string
  onHashChange: (hash: string) => void
}) {
  const [isOpen, setIsOpen] = useState(
    item.type === "folder" ? item.isExpanded : false
  )

  const { setDetailsOpen } = useDetails()

  // Render file as a simple menu item
  if (item.type === "file") {
    const isActive = currentHash === item.path

    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={item.name} isActive={isActive}>
          <HugeiconsIcon icon={File02Icon} strokeWidth={2} />
          <Link
            href={`#${item.path}`}
            className="flex-1"
            onClick={() => {
              onHashChange(item.path)
              setDetailsOpen(true)
            }}
          >
            {item.name}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // Render folder as a collapsible with recursive children
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={item.name} render={<CollapsibleTrigger />}>
          <HugeiconsIcon
            icon={isOpen ? Folder02Icon : Folder01Icon}
            strokeWidth={2}
          />
          {item.name}
          <HugeiconsIcon
            icon={ChevronDown}
            className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
      <CollapsibleContent>
        <SidebarMenu className="pl-4">
          {item.children.map((child) => (
            <TreeNode
              key={child.path}
              item={child}
              depth={depth + 1}
              currentHash={currentHash}
              onHashChange={onHashChange}
            />
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AppSidebar({
  slug,
  minimapOn,
  setMinimapOn,
  ...props
}: ComponentProps<typeof Sidebar> & {
  slug: string
  minimapOn: boolean
  setMinimapOn: (val: boolean) => void
}) {
  const project = getProject(slug)
  const [currentHash, setCurrentHash] = useState("")

  // Track hash changes for active state
  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash.slice(1)) // Remove the # prefix
    }

    // Set initial hash
    updateHash()

    // Listen for hash changes (for browser back/forward)
    window.addEventListener("hashchange", updateHash)
    return () => window.removeEventListener("hashchange", updateHash)
  }, [])

  const handleHashChange = (hash: string) => {
    setCurrentHash(hash)
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <span className="flex-center aspect-square size-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <HugeiconsIcon
              icon={Folder03Icon}
              className="size-5!"
              strokeWidth={2}
            />
          </span>
          <span className="truncate">
            {project.error ? project.error : project.name}
          </span>
        </div>
        <SearchForm />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{fileTree.name}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fileTree.children.map((child) => (
                <TreeNode
                  key={child.path}
                  item={child}
                  currentHash={currentHash}
                  onHashChange={handleHashChange}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <FieldLabel htmlFor="switch-minimap" className="cursor-pointer">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Enable minimap</FieldTitle>
              <FieldDescription>
                A tiny view of your node tree.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="switch-minimap"
              checked={minimapOn}
              onCheckedChange={setMinimapOn}
            />
          </Field>
        </FieldLabel>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
