import { AppHeader } from "@/components/app-header"
import Graph from "@/components/graph"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <SidebarProvider>
      <AppSidebar slug={slug} />
      <SidebarInset>
        <AppHeader slug={slug} />
        <main className="h-[calc(100dvh-50px)] w-full overflow-clip">
          <Graph />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
