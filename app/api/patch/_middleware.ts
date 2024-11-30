import { middleware } from '~/lib/trpc'

export const parsePatchBannerMiddleware = middleware(
  async ({ ctx, next, getRawInput }) => {
    const input = (await getRawInput()) as FormData

    const patchIdData = input.get('patchId')
    const imageData = input.get('image')

    const patchId = Number(patchIdData?.toString())
    const image = await new Response(imageData)?.arrayBuffer()

    const response = {
      patchId,
      image
    }

    return next({
      getRawInput: async () => response
    })
  }
)
