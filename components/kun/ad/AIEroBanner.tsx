import { Image } from '@heroui/image'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { cn } from '~/utils/cn'
import type { KunGalgamePayload } from '~/app/api/utils/jwt'

interface Props {
  payload: KunGalgamePayload | null
  className?: string
}

export const AIEroBanner = ({ payload, className = '' }: Props) => {
  return (
    <>
      {(!payload || payload.role < 2) && (
        <div className={cn('shadow-xl rounded-2xl', className)}>
          <a
            target="_blank"
            className="h-full w-full"
            href={kunMoyuMoe.ad[0].url}
            rel="noreferrer"
          >
            <Image
              className="pointer-events-none select-none"
              src="/a/moyumoe1.avif"
              alt=""
            />
          </a>
        </div>
      )}
    </>
  )
}
