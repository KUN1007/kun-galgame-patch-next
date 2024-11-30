import { middleware } from '~/lib/trpc'

export const parseAvatarImageMiddleware = middleware(
  async ({ ctx, next, getRawInput }) => {
    return next({
      getRawInput: async () => {
        return { avatar }
      }
    })
  }
)
