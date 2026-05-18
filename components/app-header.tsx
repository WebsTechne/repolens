"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { useRepoStore } from "@/lib/store/repo-store"
import { useSidebar } from "./ui/sidebar"
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { useDetails } from "@/contexts/details-context"

export function AppHeader({ slug }: { slug: string }) {
  const { open, toggleSidebar } = useSidebar()
  const { detailsOpen, setDetailsOpen } = useDetails()
  const { repoName } = useRepoStore()

  const projectName = repoName || slug

  return (
    <header
      className={cn(
        "pointer-events-none absolute top-0 z-1000 flex-between h-16 w-full px-4 py-3",
        "[&>section]:pointer-events-auto [&>section]:h-10 [&>section]:rounded-full [&>section]:border [&>section]:border-border/60 [&>section]:bg-card/80 [&>section]:shadow-sm"
      )}
    >
      <section
        className="inline-flex cursor-pointer items-center gap-2 px-4 text-sm leading-none font-medium text-foreground transition hover:bg-card/90 hover:shadow-md"
        onClick={toggleSidebar}
      >
        <HugeiconsIcon
          icon={open ? PanelLeftOpenIcon : PanelLeftCloseIcon}
          size={20}
          strokeWidth={2}
        />
        {projectName}
      </section>

      <section
        className="ml-auto inline-flex cursor-pointer items-center gap-2 px-4 text-sm leading-none font-medium text-foreground transition hover:bg-card/90 hover:shadow-md"
        onClick={() => setDetailsOpen(!detailsOpen)}
      >
        Details
        <HugeiconsIcon
          icon={detailsOpen ? PanelRightOpenIcon : PanelRightCloseIcon}
          size={20}
          strokeWidth={2}
        />
      </section>
    </header>
  )
}
