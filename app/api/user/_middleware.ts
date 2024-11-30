import { middleware } from '~/lib/trpc'

export const parseAvatarImageMiddleware = middleware(
  async ({ ctx, next, getRawInput }) => {
    const input = (await getRawInput()) as FormData
    const avatarData = input.get('avatar')

    const avatar = await new Response(avatarData)?.arrayBuffer()

    return next({
      getRawInput: async () => {
        return { avatar }
      }
    })
  }
)
