import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { Plus, X } from 'lucide-react'
import { ErrorType } from './share'

interface ResourceLinksInputProps {
  errors: ErrorType
  links: string[]
  setValue: (value: string[]) => void
}

export const ResourceLinksInput = ({
  errors,
  links,
  setValue
}: ResourceLinksInputProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">资源链接</h3>
      {links.map((link: string, index: number) => (
        <div key={index} className="flex gap-2">
          <Input
            isRequired
            placeholder="请输入资源链接"
            value={link}
            isInvalid={!!errors.link?.[index]}
            errorMessage={errors.link?.[index]?.message}
            onChange={(e) => {
              e.preventDefault()
              const newLinks = [...links]
              newLinks[index] = e.target.value
              setValue(newLinks)
            }}
          />
          {index === links.length - 1 ? (
            <Button
              isIconOnly
              variant="flat"
              onPress={() => setValue([...links, ''])}
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
      ))}
    </div>
  )
}
