"use client"

import { ComponentProps, useState, useEffect } from "react"
import { useFlowStore } from "@/lib/store/flow-store"
import { useRepoStore } from "@/lib/store/repo-store"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ChevronDown,
  Folder01Icon,
  Folder02Icon,
  Folder03Icon,
  File02Icon,
  Delete02Icon,
  FullScreenIcon,
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

import type { FileTreeItem, FolderTreeItem, TreeItem } from "@/app/types/types"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

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
  const { username, repoName } = useRepoStore()
  const { fileTree } = useFlowStore()
  const [currentHash, setCurrentHash] = useState("")
  const { clearFlowData } = useFlowStore()
  const [clearing, setClearing] = useState(false)
  const router = useRouter()

  const handleClearData = async () => {
    setClearing(true)
    await clearFlowData()
    router.push("/")
  }

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

  const projectName = repoName || slug

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
          <span className="truncate">{projectName}</span>
        </div>
        <SearchForm />
      </SidebarHeader>

      <SidebarContent>
        {fileTree ? (
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
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-center text-sm text-muted-foreground">
              No file tree data available
            </p>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setMinimapOn(!minimapOn)}>
              <HugeiconsIcon icon={FullScreenIcon} strokeWidth={2} />
              <span className="flex-1">Enable Minimap</span>
              <Switch
                id="switch-minimap"
                checked={minimapOn}
                onCheckedChange={setMinimapOn}
                className="float-right"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Button
                  variant="destructive"
                  className="gap-1 hover:text-destructive! hover:opacity-80!"
                  onClick={handleClearData}
                  disabled={clearing}
                />
              }
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              {clearing ? "Clearing..." : "Clear data"}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// Made with Bob
