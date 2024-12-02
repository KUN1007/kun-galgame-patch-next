import { Chip } from '@nextui-org/chip'
import { Snippet } from '@nextui-org/snippet'
import {
  SUPPORTED_TYPE_MAP,
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP
} from '~/constants/resource'
import type { PatchResource } from '~/types/api/patch'

interface Props {
  resource: PatchResource
}

export const ResourceInfo = ({ resource }: Props) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {resource.type.map((type) => (
          <Chip key={type} variant="flat" color="primary">
            {SUPPORTED_TYPE_MAP[type]}
          </Chip>
        ))}
        {resource.language.map((lang) => (
          <Chip key={lang} variant="flat" color="secondary">
            {SUPPORTED_LANGUAGE_MAP[lang]}
          </Chip>
        ))}
        {resource.platform.map((platform) => (
          <Chip key={platform} variant="flat" color="success">
            {SUPPORTED_PLATFORM_MAP[platform]}
          </Chip>
        ))}
        {<Chip variant="flat">{resource.size}</Chip>}
      </div>

      <div className="flex flex-wrap gap-2">
        {resource.code && (
          <Snippet
            tooltipProps={{
              content: '点击复制提取码'
            }}
            size="sm"
            symbol="提取码"
            color="primary"
            className="py-0"
          >
            {resource.code}
          </Snippet>
        )}

        {resource.password && (
          <Snippet
            tooltipProps={{
              content: '点击复制解压码'
            }}
            size="sm"
            symbol="解压码"
            color="primary"
            className="py-0"
          >
            {resource.password}
          </Snippet>
        )}
      </div>

      {resource.note && <p className="mt-2">{resource.note}</p>}
    </div>
  )
}
