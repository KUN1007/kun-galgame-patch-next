'use client'

import { Snippet } from '@heroui/snippet'
import { Chip } from '@heroui/chip'
import { Link } from '@heroui/link'
import { Cloud, Link as LinkIcon, Database } from 'lucide-react'
import { SUPPORTED_RESOURCE_LINK_MAP } from '~/constants/resource'
import { kunFetchPut } from '~/utils/kunFetch'
import type { JSX } from 'react'
import type { PatchResourceHtml } from '~/types/api/patch'

const storageIcons: { [key: string]: JSX.Element } = {
  s3: <Cloud className="size-4" />,
  user: <LinkIcon className="size-4" />
}

interface Props {
  resource: PatchResourceHtml
}

export const ResourceDownloadCard = ({ resource }: Props) => {
  const handleClickDownload = async () => {
    await kunFetchPut<KunResponse<{}>>('/patch/resource/download', {
      patchId: resource.patchId,
      resourceId: resource.id
    })
  }

  return (
    <div className="p-3 bg-success/15 border border-success rounded-2xl flex flex-col space-y-2">
      <h2>资源下载链接</h2>

      <div className="flex items-center gap-2">
        <Chip
          color="secondary"
          variant="flat"
          startContent={storageIcons[resource.storage]}
        >
          {SUPPORTED_RESOURCE_LINK_MAP[resource.storage as 's3' | 'user']}
        </Chip>
        <Chip
          variant="flat"
          color="warning"
          startContent={<Database className="w-4 h-4" />}
        >
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
                BLAKE3 校验码 (您可以根据此校验码校验下载文件完整性{' '}
                <Link
                  size="sm"
                  underline="always"
                  href={`/check-hash?hash=${resource.hash}&content=${resource.content}`}
                >
                  前往校验页面
                </Link>
                )
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
