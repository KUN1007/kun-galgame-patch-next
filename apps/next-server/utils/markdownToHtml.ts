import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypePrism from 'rehype-prism-plus'
import { unified } from 'unified'

import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
// import type { Element } from 'hast'

const rehypeKunH1ToH2: Plugin<[], any> = () => {
  return (tree) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName === 'h1') {
        node.tagName = 'h2'
      }
    })
  }
}

export const markdownToHtml = async (markdown: string) => {
  const htmlVFile = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(rehypePrism, { ignoreMissing: true })
    .use(rehypeKunH1ToH2)
    // @ts-expect-error kun love ren 1314~
    .use(rehypeStringify)
    .process(markdown)

  return String(htmlVFile)
}
