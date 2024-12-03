import { getAllPosts } from '~/lib/mdx/getPosts'
import { KunAboutHeader } from '~/components/about/Header'
import { KunAboutCard } from '~/components/about/Card'

export default function Kun() {
  const posts = getAllPosts()

  // const filteredPosts = posts.filter((post) =>
  //   post.title.toLowerCase().includes(searchQuery.toLowerCase())
  // )

  return (
    <div className="w-full max-w-4xl mx-auto">
      <KunAboutHeader />

      <div className="grid gap-4">
        {posts.map((post) => (
          <KunAboutCard key={post.slug} post={post} />
        ))}

        {/* {filteredPosts.length === 0 && (
            <div className="py-12 text-center text-default-500">
              No posts found matching your search criteria.
            </div>
          )} */}
      </div>
    </div>
  )
}
