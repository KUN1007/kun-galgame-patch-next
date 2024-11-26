import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { Chip } from '@nextui-org/chip'
import { Plus, X } from 'lucide-react'
import { ErrorType } from '../share'
import { SUPPORTED_RESOURCE_LINK_MAP } from '~/constants/resource'
import type { PatchResourceLink } from '~/types/api/patch'

interface ResourceLinksInputProps {
  errors: ErrorType
  links: PatchResourceLink[]
  setValue: (value: PatchResourceLink[]) => void
}

export const ResourceLinksInput = ({
  errors,
  links,
  setValue
}: ResourceLinksInputProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">资源链接</h3>
      <p className="text-sm text-default-500">
        上传资源会自动添加资源链接, 您也可以自行添加资源链接。为保证单一性,
        建议您一次添加一条资源链接
      </p>
      {links.map((link, index) => {
        return (
          <div key={index} className="flex items-center gap-2">
            <Chip color="primary" variant="flat">
              {
                SUPPORTED_RESOURCE_LINK_MAP[
                  link.type as 's3' | 'onedrive' | 'user'
                ]
              }
            </Chip>

            <div className="flex-col w-full">
              <Input
                isRequired
                placeholder={
                  link.type === 'user' ? '请输入资源链接' : '资源链接不可编辑'
                }
                value={link.content}
                isReadOnly={link.type !== 'user'}
                isDisabled={link.type !== 'user'}
                isInvalid={!!errors.link?.[index]?.content}
                errorMessage={errors.link?.[index]?.content?.message}
                onChange={(e) => {
                  const newLinks = [...links]
                  newLinks[index] = {
                    ...newLinks[index],
                    content: e.target.value
                  }
                  setValue(newLinks)
                }}
              />
            </div>

            <div className="flex justify-end">
              {index === links.length - 1 ? (
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={() =>
                    setValue([
                      ...links,
                      { id: 0, type: 'user', content: '', hash: '' }
                    ])
                  }
                >
                  <Plus className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  isIconOnly
                  variant="flat"
                  color="danger"
                  onPress={() => {
                    const newLinks = links.filter((_, i) => i !== index)
                    setValue(newLinks)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
