"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { getProject } from "./sidebar/app-sidebar"
import { SidebarTrigger, useSidebar } from "./ui/sidebar"
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "@hugeicons/core-free-icons"

export function AppHeader({ slug }: { slug: string }) {
  const { open, toggleSidebar } = useSidebar()
  const project = getProject(slug)

  return (
    <header className="flex-between h-12.5 border-b px-3">
      <section className="flex items-center gap-1">
        <SidebarTrigger size="icon" onClick={toggleSidebar}>
          <HugeiconsIcon icon={open ? PanelLeftOpenIcon : PanelLeftCloseIcon} />
        </SidebarTrigger>
        {project.error ? project.error : project.name}
      </section>
    </header>
  )
}
