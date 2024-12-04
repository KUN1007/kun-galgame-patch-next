import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { KunPostMetadata } from './types'

const POSTS_PATH = path.join(process.cwd(), 'posts')

export const getAllPosts = () => {
  const posts: KunPostMetadata[] = []

  const traverseDirectory = (currentPath: string, basePath: string = '') => {
    const files = fs.readdirSync(currentPath)

    files.forEach((file) => {
      const filePath = path.join(currentPath, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        traverseDirectory(filePath, path.join(basePath, file))
      } else if (file.endsWith('.mdx')) {
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const { data } = matter(fileContents)

        const slug = path
          .join(basePath, file.replace(/\.mdx$/, ''))
          .replace(/\\/g, '/')

        posts.push({
          title: data.title,
          date: data.date ? new Date(data.date).toISOString() : '',
          banner: data.banner,
          slug,
          path: slug
        })
      }
    })
  }

  traverseDirectory(POSTS_PATH)
  return posts.sort((a, b) => (a.date > b.date ? -1 : 1))
}

export const getPostBySlug = (slug: string) => {
  const realSlug = slug.replace(/\.mdx$/, '')
  const fullPath = path.join(POSTS_PATH, `${realSlug}.mdx`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    slug: realSlug,
    frontmatter: data,
    content
  }
}

export const getAdjacentPosts = (currentSlug: string) => {
  const posts = getAllPosts()
  const currentIndex = posts.findIndex((post) => post.slug === currentSlug)

  return {
    prev: currentIndex > 0 ? posts[currentIndex - 1] : null,
    next: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null
  }
}
