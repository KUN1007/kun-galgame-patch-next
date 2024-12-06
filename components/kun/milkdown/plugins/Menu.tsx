import { useRef, useState } from 'react'
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@nextui-org/react'
import {
  Bold,
  Code,
  Code2,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Quote,
  SmilePlus,
  Strikethrough
} from 'lucide-react'
import { callCommand } from '@milkdown/utils'
import { CmdKey } from '@milkdown/core'
import {
  createCodeBlockCommand,
  insertHrCommand,
  insertImageCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleLinkCommand,
  toggleStrongCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand
} from '@milkdown/preset-commonmark'
import { toggleStrikethroughCommand } from '@milkdown/preset-gfm'
import toast from 'react-hot-toast'
import { resizeImage } from '~/utils/resizeImage'
import { kunFetchFormData } from '~/utils/kunFetch'
import type { UseEditorReturn } from '@milkdown/react'

export const KunMilkdownPluginsMenu = ({
  editorInfo
}: {
  editorInfo: UseEditorReturn
}) => {
  const [link, setLink] = useState('')
  const uploadImageInputRef = useRef<HTMLInputElement | null>(null)

  const { get } = editorInfo
  const call = <T,>(command: CmdKey<T>, payload?: T) => {
    return get()?.action(callCommand(command, payload))
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    const miniImage = await resizeImage(file, 1920, 1080)
    formData.append('image', miniImage)

    toast.loading('正在上传图片...')

    const res = await kunFetchFormData<
      KunResponse<{
        imageLink: string
      }>
    >('/user/image', formData)
    if (typeof res === 'string') {
      toast.error(res)
      return
    } else {
      toast.success('上传图片成功')
      call(insertImageCommand.key, {
        src: res.imageLink,
        title: file.name,
        alt: file.name
      })
    }
  }

  return (
    <div className="sticky top-0 flex flex-wrap bg-opacity-80 backdrop-blur-md">
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(toggleStrongCommand.key)}
      >
        <Bold className="size-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(toggleEmphasisCommand.key)}
      >
        <Italic className="size-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(toggleStrikethroughCommand.key)}
      >
        <Strikethrough className="size-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(wrapInBulletListCommand.key)}
      >
        <List className="size-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(wrapInOrderedListCommand.key)}
      >
        <ListOrdered className="size-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(wrapInBlockquoteCommand.key)}
      >
        <Quote className="size-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(insertHrCommand.key)}
      >
        <Minus className="size-6" />
      </Button>
      <Popover placement="bottom" offset={10}>
        <PopoverTrigger>
          <Button isIconOnly variant="light">
            <Link className="size-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px]">
          {(titleProps) => (
            <div className="w-full px-1 py-2">
              <p
                className="text-small font-bold text-foreground"
                {...titleProps}
              >
                选中文本以插入链接
              </p>
              <div className="mt-2 flex w-full flex-col gap-2">
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  label="链接 URL"
                  size="sm"
                  variant="bordered"
                />
              </div>

              <Button
                variant="flat"
                color="primary"
                onClick={() => {
                  call(toggleLinkCommand.key, {
                    href: link
                  })
                  setLink('')
                }}
                className="mt-2 w-full"
              >
                确定插入
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Button
        isIconOnly
        variant="light"
        onClick={() => call(createCodeBlockCommand.key, 'javascript')}
      >
        <Code2 className="size-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(toggleInlineCodeCommand.key)}
      >
        <Code className="size-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => uploadImageInputRef.current?.click()}
      >
        <ImagePlus className="size-6" />
        <input
          ref={uploadImageInputRef}
          type="file"
          accept=".jpg, .jpeg, .png, .webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </Button>
      <Button isIconOnly variant="light">
        <SmilePlus className="size-6" />
      </Button>
    </div>
  )
}
