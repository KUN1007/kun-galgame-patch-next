import { middleware } from '~/lib/trpc'
import type { PatchFormData } from '~/store/editStore'

export const parseEditFormDataMiddleware = middleware(
  async ({ ctx, next, getRawInput }) => {
    const input = (await getRawInput()) as FormData

    const nameData = input.get('name')
    const bannerData = input.get('banner')
    const introductionData = input.get('introduction')
    const vndbIdData = input.get('vndbId')
    const aliasesData = input.get('alias')

    const requestData: Partial<PatchFormData> & {
      banner: ArrayBuffer
    } = {
      name: nameData?.toString(),
      banner: await new Response(bannerData)?.arrayBuffer(),
      introduction: introductionData?.toString(),
      vndbId: vndbIdData?.toString(),
      alias: JSON.parse(aliasesData ? aliasesData.toString() : '')
    }

    return next({
      getRawInput: async () => requestData
    })
  }
)

export const parseEditorImageMiddleware = middleware(
  async ({ ctx, next, getRawInput }) => {
    const input = (await getRawInput()) as FormData
    const imageData = input.get('image')

    const image = await new Response(imageData)?.arrayBuffer()

    return next({
      getRawInput: async () => {
        return { image }
      }
    })
  }
)
