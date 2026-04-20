import { listAllPosts } from '~~/server/utils/posts'

export default defineEventHandler((): KunPostMetadata[] => listAllPosts())
