import fs from 'fs'
import path from 'path'
import { TreeNode } from './types'

const POSTS_PATH = path.join(process.cwd(), 'posts')

export const getDirectoryTree = (): TreeNode => {
  function buildTree(currentPath: string, baseName: string): TreeNode | null {
    const stats = fs.statSync(currentPath)

    if (stats.isFile() && currentPath.endsWith('.mdx')) {
      return {
        name: baseName.replace(/\.mdx$/, ''),
        path: path
          .relative(POSTS_PATH, currentPath)
          .replace(/\.mdx$/, '')
          .replace(/\\/g, '/'),
        type: 'file'
      }
    }

    if (stats.isDirectory()) {
      const children = fs
        .readdirSync(currentPath)
        .map((child) => buildTree(path.join(currentPath, child), child))
        .filter((child): child is TreeNode => child !== null)

      return {
        name: baseName,
        path: path.relative(POSTS_PATH, currentPath).replace(/\\/g, '/'),
        children,
        type: 'directory'
      }
    }

    return null
  }

  return buildTree(POSTS_PATH, 'about') as TreeNode
}
