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
        <main className="relative h-dvh w-full overflow-clip">
          <AppHeader slug={slug} />
          <div className="h-dvh w-[100vw-18rem] md:w-[100vw-16rem]">
            <Graph />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
