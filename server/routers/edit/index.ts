import { z } from 'zod'
import { cookies } from 'next/headers'
import { router, privateProcedure } from '~/lib/trpc'
import { verify, hash } from '@node-rs/argon2'
import { generateKunToken } from '~/server/utils/jwt'
import { patchSchema } from '~/validations/edit'
import { uploadImage } from '~/server/utils/uploadImage'
import type { PatchFormRequestData } from '~/store/editStore'

export const editRouter = router({
  edit: privateProcedure.input(patchSchema).mutation(async ({ ctx, input }) => {
    const { name, vndbId, alias, banner, introduction } = input

    console.log(banner)

    // let bannerUrl = null
    // if (banner) {
    //   bannerUrl = await uploadBanner(banner)
    // }

    // const patch = await ctx.prisma.patch.create({
    //   data: {
    //     name,
    //     vndbId,
    //     alias,
    //     banner: bannerUrl,
    //     introduction
    //   }
    // })

    // return {
    //   success: true,
    //   patchId: patch.id
    // }
  })
})
