'use client'

import { Snippet } from '@nextui-org/snippet'
import { Chip } from '@nextui-org/chip'
import { Link } from '@nextui-org/link'
import { Cloud, Link as LinkIcon } from 'lucide-react'
import { MicrosoftIcon } from './icons/MicrosoftIcon'
import { SUPPORTED_RESOURCE_LINK_MAP } from '~/constants/resource'
import type { PatchResource } from '~/types/api/patch'

const storageIcons: { [key: string]: JSX.Element } = {
  s3: <Cloud className="w-4 h-4" />,
  onedrive: <MicrosoftIcon className="w-4 h-4" />,
  user: <LinkIcon className="w-4 h-4" />
}

interface Props {
  resource: PatchResource
}

export const ResourceDownloadCard = ({ resource }: Props) => {
  return (
    <div className="flex flex-col space-y-2">
      <Chip
        color="secondary"
        variant="flat"
        startContent={storageIcons[resource.storage]}
      >
        {
          SUPPORTED_RESOURCE_LINK_MAP[
            resource.storage as 's3' | 'onedrive' | 'user'
          ]
        }
      </Chip>

      <p className="text-sm text-default-500">点击下面的链接以下载</p>

      {resource.content.split(',').map((link) => (
        <div key={Math.random()} className="space-y-2">
          <Link
            isExternal
            underline="always"
            className="block overflow-auto whitespace-normal"
            href={link}
          >
            {link}
          </Link>

          {resource.storage !== 'user' && (
            <>
              <p className="text-sm">
                BLACK3 校验码 (您可以根据此校验码校验下载文件完整性)
              </p>
              <Snippet
                symbol=""
                className="flex overflow-auto whitespace-normal"
              >
                {resource.hash}
              </Snippet>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
