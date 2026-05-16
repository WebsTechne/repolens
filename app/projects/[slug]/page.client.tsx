"use client"

import { AppHeader } from "@/components/app-header"
import { DetailsPanel } from "@/components/details-panel"
import Graph from "@/components/graph"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DetailsProvider, useDetails } from "@/contexts/details-context"
import { useState } from "react"

function PageClientContent({ slug }: { slug: string }) {
  const [minimapOn, setMinimapOn] = useState(true)

  return (
    <SidebarProvider>
      <AppSidebar
        slug={slug}
        minimapOn={minimapOn}
        setMinimapOn={setMinimapOn}
      />
      <SidebarInset>
        <main className="relative h-dvh w-full overflow-clip">
          <AppHeader slug={slug} />
          <div className="h-dvh w-[100vw-18rem] md:w-[100vw-16rem]">
            <Graph minimapOn={minimapOn} />
          </div>
        </main>

        <DetailsPanel />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function PageClient({ slug }: { slug: string }) {
  return (
    <DetailsProvider>
      <SidebarProvider>
        <PageClientContent slug={slug} />
      </SidebarProvider>
    </DetailsProvider>
  )
}
