import { z } from 'zod'

const envSchema = z.object({
  KUN_DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_KUN_PATCH_ADDRESS: z.string(),
  JWT_ISS: z.string(),
  JWT_AUD: z.string(),
  JWT_SECRET: z.string(),
  NODE_ENV: z.enum(['development', 'test', 'production'])
})

export const env = envSchema.safeParse(process.env)

if (!env.success) {
  throw new Error(
    '❌ Invalid environment variables: ' +
      JSON.stringify(env.error.format(), null, 4)
  )
}
