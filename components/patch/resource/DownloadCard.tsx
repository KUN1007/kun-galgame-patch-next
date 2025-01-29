'use client'

import { Snippet } from '@nextui-org/snippet'
import { Chip } from '@nextui-org/chip'
import { Link } from '@nextui-org/link'
import { Cloud, Link as LinkIcon, Database } from 'lucide-react'
import { SUPPORTED_RESOURCE_LINK_MAP } from '~/constants/resource'
import { kunFetchPut } from '~/utils/kunFetch'
import type { JSX } from 'react'
import type { PatchResource } from '~/types/api/patch'

const storageIcons: { [key: string]: JSX.Element } = {
  s3: <Cloud className="size-4" />,
  user: <LinkIcon className="size-4" />
}

interface Props {
  resource: PatchResource
}

export const ResourceDownloadCard = ({ resource }: Props) => {
  const handleClickDownload = async () => {
    await kunFetchPut<KunResponse<{}>>('/patch/resource/download', {
      patchId: resource.patchId,
      resourceId: resource.id
    })
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center gap-2">
        <Chip
          color="secondary"
          variant="flat"
          startContent={storageIcons[resource.storage]}
        >
          {SUPPORTED_RESOURCE_LINK_MAP[resource.storage as 's3' | 'user']}
        </Chip>
        <Chip variant="flat" startContent={<Database className="w-4 h-4" />}>
          {resource.size}
        </Chip>
      </div>

      <p className="text-sm text-default-500">点击下面的链接以下载</p>

      {resource.content.split(',').map((link) => (
        <div key={Math.random()} className="space-y-2">
          <Link
            isExternal
            onPress={handleClickDownload}
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
