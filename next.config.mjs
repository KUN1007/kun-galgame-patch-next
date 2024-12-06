import { env } from './validations/dotenv-check.mjs'
import createMDX from '@next/mdx'
// import remarkGfm from 'remark-gfm'
// import rehypeSlug from 'rehype-slug'
// import rehypeAutolinkHeadings from 'rehype-autolink-headings'
// import rehypePrettyCode from 'rehype-pretty-code'

const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  transpilePackages: ['next-mdx-remote'],
  publicRuntimeConfig: {
    NODE_ENV: env.data.NODE_ENV
  },
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  typescript: {
    ignoreBuildErrors: true
  },
  sassOptions: {
    silenceDeprecations: ['legacy-js-api']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sticker.kungal.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'image.moyu.moe',
        port: '',
        pathname: '/**'
      }
    ]
  }
}

// Turbopack compatible errors
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    // remarkPlugins: [remarkGfm],
    rehypePlugins: [
      // rehypeSlug,
      // [
      //   rehype - autolink - headings,
      //   {
      //     properties: {
      //       className: ['anchor'],
      //     },
      //   },
      // ],
      // [
      //   rehypePrettyCode,
      //   {
      //     theme: 'github-dark',
      //   },
      // ],
    ]
  }
})

export default withMDX(nextConfig)
