import PageClient from "./page.client"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PageClient slug={slug} />
}
