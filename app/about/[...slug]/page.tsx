import { getAdjacentPosts, getPostBySlug } from '~/lib/mdx/getPosts'
import { CustomMDX } from '~/lib/mdx/CustomMDX'
import { TableOfContents } from '~/components/about/TableOfContents'
import { KunBottomNavigation } from '~/components/about/Navigation'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{
    slug: string[]
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const url = slug.join('/')
  const blog = getPostBySlug(url)
  return generateKunMetadataTemplate(blog)
}

export default async function Kun({ params }: Props) {
  const { slug } = await params
  const url = slug.join('/')
  const { content } = getPostBySlug(url)
  const { prev, next } = getAdjacentPosts(url)

  return (
    <div className="flex w-full">
      <div className="w-full max-w-3xl px-6">
        <article className="kun-prose">
          <CustomMDX source={content} />
        </article>
        <KunBottomNavigation prev={prev} next={next} />
      </div>

      <div>
        <div className="fixed">
          <TableOfContents />
        </div>
      </div>
    </div>
  )
}
