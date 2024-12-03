import { getAllPosts } from '~/lib/mdx/getPosts'
import { getDirectoryTree } from '~/lib/mdx/directoryTree'
import { KunSidebar } from '~/components/about/Sidebar'
import { Card, CardBody } from '@nextui-org/card'
import Link from 'next/link'

export default function Kun() {
  const posts = getAllPosts()
  const tree = getDirectoryTree()

  return (
    <div className="flex">
      <KunSidebar tree={tree} />

      <div className="flex-1 max-w-3xl px-4 py-8 mx-auto">
        <h1 className="mb-8 text-4xl font-bold">About</h1>
        <div className="grid gap-4">
          {posts.map((post) => (
            <Link key={post.slug} href={`/about/${post.slug}`}>
              <Card>
                <CardBody>
                  <h2 className="mb-2 text-xl font-semibold">{post.title}</h2>
                  <time className="text-sm text-default-500">
                    {new Date(post.date).toLocaleDateString()}
                  </time>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
