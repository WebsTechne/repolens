"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { getProject } from "./sidebar/app-sidebar"
import { SidebarTrigger, useSidebar } from "./ui/sidebar"
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export function AppHeader({ slug }: { slug: string }) {
  const { open, toggleSidebar } = useSidebar()
  const project = getProject(slug)

  return (
    <header
      className={cn(
        "absolute top-0 z-1000 flex-between h-16 w-full px-3 py-3",
        "[&>section]:h-10 [&>section]:rounded-lg [&>section]:border [&>section]:bg-muted"
      )}
    >
      <section
        className="flex-between cursor-pointer gap-4 px-3 hover:opacity-90"
        onClick={toggleSidebar}
      >
        <HugeiconsIcon
          icon={open ? PanelLeftOpenIcon : PanelLeftCloseIcon}
          size={20}
          strokeWidth={2}
        />
        {project.error ? project.error : project.name}
      </section>

      <section
        className="flex-between cursor-pointer gap-4 px-3 hover:opacity-90"
        onClick={toggleSidebar}
      >
        Details
        <HugeiconsIcon
          icon={open ? PanelRightOpenIcon : PanelRightCloseIcon}
          size={20}
          strokeWidth={2}
        />
      </section>
    </header>
  )
}
