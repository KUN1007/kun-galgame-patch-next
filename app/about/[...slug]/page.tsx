import { getPostBySlug, getAdjacentPosts } from '~/lib/mdx/getPosts'
import { getDirectoryTree } from '~/lib/mdx/directoryTree'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { KunSidebar } from '~/components/about/Sidebar'
import { TableOfContents } from '~/components/about/TableOfContents'
import { KunBottomNavigation } from '~/components/about/Navigation'

interface PostPageProps {
  params: Promise<{
    slug: string[]
  }>
}

export default async function Kun({ params }: PostPageProps) {
  const { slug } = await params
  const url = slug.join('/')
  const { content, frontmatter } = getPostBySlug(url)
  const tree = getDirectoryTree()
  const { prev, next } = getAdjacentPosts(url)

  return (
    <div className="flex w-full">
      <KunSidebar tree={tree} />
      <div className="flex-1 max-w-3xl px-4 py-8 mx-auto">
        <article className="prose dark:prose-invert max-w-none">
          <MDXRemote source={content} />
        </article>
        <KunBottomNavigation prev={prev} next={next} />
      </div>
      <TableOfContents />
    </div>
  )
}
