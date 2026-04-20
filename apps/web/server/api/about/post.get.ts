import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { getAdjacentPosts, readPost } from '~~/server/utils/posts'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true })

export default defineEventHandler(async (event): Promise<KunPostDetail> => {
  const query = getQuery(event)
  const slug = String(query.slug ?? '')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const post = readPost(slug)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  const html = String(await processor.process(post.content))
  const { prev, next } = getAdjacentPosts(post.slug)

  return {
    slug: post.slug,
    html,
    frontmatter: post.frontmatter,
    prev,
    next
  }
})
