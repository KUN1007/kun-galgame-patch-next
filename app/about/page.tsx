import { getAllPosts } from '~/lib/mdx/getPosts'
import { KunAboutHeader } from '~/components/about/Header'
import { KunAboutCard } from '~/components/about/Card'
import { KunMasonryGrid } from '~/components/kun/MasonryGrid'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function Kun() {
  const posts = getAllPosts()

  // const filteredPosts = posts.filter((post) =>
  //   post.title.toLowerCase().includes(searchQuery.toLowerCase())
  // )

  return (
    <div className="w-full px-6">
      <KunAboutHeader />

      <div className="grid gap-4">
        <KunMasonryGrid columnWidth={256} gap={24}>
          {posts.map((post) => (
            <KunAboutCard key={post.slug} post={post} />
          ))}
        </KunMasonryGrid>

        {/* {filteredPosts.length === 0 && (
            <div className="py-12 text-center text-default-500">
              No posts found matching your search criteria.
            </div>
          )} */}
      </div>
    </div>
  )
}
