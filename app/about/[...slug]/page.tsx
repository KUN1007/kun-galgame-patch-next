import { getPostBySlug, getAdjacentPosts } from '~/lib/mdx/getPosts'
import { MDXRemote } from 'next-mdx-remote/rsc'
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
  const { prev, next } = getAdjacentPosts(url)

  return (
    <div className="flex w-full">
      <div className="w-full max-w-3xl">
        <article className="mx-auto prose dark:prose-invert">
          <MDXRemote source={content} />
        </article>
        <KunBottomNavigation prev={prev} next={next} />
      </div>
      <TableOfContents />
    </div>
  )
}
