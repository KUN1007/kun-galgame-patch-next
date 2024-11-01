import { useState } from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Input
} from '@nextui-org/react'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link,
  Code,
  SmilePlus,
  ImagePlus,
  Code2
} from 'lucide-react'
import { callCommand } from '@milkdown/utils'
import { CmdKey } from '@milkdown/core'
import {
  createCodeBlockCommand,
  toggleEmphasisCommand,
  toggleStrongCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  insertHrCommand,
  insertImageCommand,
  toggleInlineCodeCommand,
  toggleLinkCommand
} from '@milkdown/preset-commonmark'
import { toggleStrikethroughCommand } from '@milkdown/preset-gfm'
import type { UseEditorReturn } from '@milkdown/react'

export const KunMilkdownPluginsMenu = ({
  editorInfo
}: {
  editorInfo: UseEditorReturn
}) => {
  const [link, setLink] = useState('')

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
    formData.append('image', file)

    const result = await fetch('/api/image/topic', {
      method: 'POST',
      body: formData
    }).then((res) => res.json())

    if (result) {
      const imageName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9 ]/g, '')}`
      call(insertImageCommand.key, {
        src: result,
        title: imageName,
        alt: imageName
      })
    }
  }

  return (
    <div className="sticky top-0 z-50 flex flex-wrap bg-opacity-80 backdrop-blur-md">
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(toggleStrongCommand.key)}
      >
        <Bold className="w-6 h-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(toggleEmphasisCommand.key)}
      >
        <Italic className="w-6 h-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(toggleStrikethroughCommand.key)}
      >
        <Strikethrough className="w-6 h-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(wrapInBulletListCommand.key)}
      >
        <List className="w-6 h-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(wrapInOrderedListCommand.key)}
      >
        <ListOrdered className="w-6 h-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(wrapInBlockquoteCommand.key)}
      >
        <Quote className="w-6 h-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(insertHrCommand.key)}
      >
        <Minus className="w-6 h-6" />
      </Button>
      <Popover placement="bottom" offset={10}>
        <PopoverTrigger>
          <Button isIconOnly variant="light">
            <Link className="w-6 h-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px]">
          {(titleProps) => (
            <div className="w-full px-1 py-2">
              <p
                className="font-bold text-small text-foreground"
                {...titleProps}
              >
                选中文本以插入链接
              </p>
              <div className="flex flex-col w-full gap-2 mt-2">
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
                className="w-full mt-2"
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
        <Code2 className="w-6 h-6" />
      </Button>
      <Button
        isIconOnly
        variant="light"
        onClick={() => call(toggleInlineCodeCommand.key)}
      >
        <Code className="w-6 h-6" />
      </Button>
      <Button isIconOnly variant="light">
        <ImagePlus className="w-6 h-6" />
        <input
          type="file"
          accept=".jpg, .jpeg, .png, .webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </Button>
      <Button isIconOnly variant="light">
        <SmilePlus className="w-6 h-6" />
      </Button>
    </div>
  )
}
