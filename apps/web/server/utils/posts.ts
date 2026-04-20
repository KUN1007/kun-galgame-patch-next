import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export const POSTS_PATH = path.join(process.cwd(), 'posts')

export const listAllPosts = (): KunPostMetadata[] => {
  if (!fs.existsSync(POSTS_PATH)) return []

  const posts: KunPostMetadata[] = []

  const walk = (currentPath: string, basePath = '') => {
    for (const file of fs.readdirSync(currentPath)) {
      const filePath = path.join(currentPath, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        walk(filePath, path.join(basePath, file))
      } else if (file.endsWith('.mdx')) {
        const raw = fs.readFileSync(filePath, 'utf8')
        const { data, content } = matter(raw)
        const slug = path
          .join(basePath, file.replace(/\.mdx$/, ''))
          .replace(/\\/g, '/')
        const directory = basePath.split(path.sep)[0] ?? ''

        posts.push({
          title: data.title ?? '',
          banner: data.banner ?? '',
          date: data.date ? new Date(data.date).toISOString() : '',
          description: data.description ?? '',
          textCount: Math.max(0, content.length - 300),
          slug,
          path: slug,
          directory
        })
      }
    }
  }

  walk(POSTS_PATH)
  return posts.sort((a, b) => (a.date > b.date ? -1 : 1))
}

export const readPost = (slug: string) => {
  const safe = slug.replace(/\.mdx$/, '')
  const fullPath = path.join(POSTS_PATH, `${safe}.mdx`)
  if (!fs.existsSync(fullPath)) return null
  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(raw)
  return {
    slug: safe,
    content,
    frontmatter: data as KunPostFrontmatter
  }
}

export const getAdjacentPosts = (currentSlug: string) => {
  const posts = listAllPosts()
  const index = posts.findIndex((p) => p.slug === currentSlug)
  return {
    prev: index > 0 ? posts[index - 1] ?? null : null,
    next:
      index >= 0 && index < posts.length - 1 ? posts[index + 1] ?? null : null
  }
}
