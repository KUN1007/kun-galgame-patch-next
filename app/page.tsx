'use client'

import { api, HydrateClient } from '~/trpc/server'

export default function Home() {
  return (
    <HydrateClient>
      <div className="flex items-center justify-center min-h-screen bg-gray-100"></div>
    </HydrateClient>
  )
}
