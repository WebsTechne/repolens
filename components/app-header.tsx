"use client"

import { getProject } from "./sidebar/app-sidebar"

export function AppHeader({ slug }: { slug: string }) {
  const project = getProject(slug)

  return (
    <header className="flex-between h-12.5 border-b px-3">
      {project.error ? project.error : project.name}
    </header>
  )
}
