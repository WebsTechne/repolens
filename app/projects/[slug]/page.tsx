import { AppHeader } from "@/components/app-header"
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
        <main className="">Project: {slug}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
