import { useRef, useState } from 'react'
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@nextui-org/react'
import { ImagePlus, Link } from 'lucide-react'
import { callCommand } from '@milkdown/utils'
import {
  insertImageCommand,
  toggleLinkCommand
} from '@milkdown/preset-commonmark'
import toast from 'react-hot-toast'
import { resizeImage } from '~/utils/resizeImage'
import { kunFetchFormData } from '~/utils/kunFetch'
import { MenuButton } from './MenuButton'
import { createButtons } from './_buttonList'
import type { CmdKey } from '@milkdown/core'
import type { UseEditorReturn } from '@milkdown/react'
import { cn } from '~/utils/cn'

export const KunMilkdownPluginsMenu = ({
  editorInfo,
  className
}: {
  editorInfo: UseEditorReturn
  className?: string
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

    toast('正在上传图片...')

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

  const buttonList = createButtons(call)

  return (
    <div className={cn('sticky top-0 flex flex-wrap', className)}>
      {buttonList.map(({ tooltip, icon, onPress, ariaLabel }, index) => (
        <MenuButton
          key={index}
          tooltip={tooltip}
          icon={icon}
          onPress={onPress}
          ariaLabel={ariaLabel}
        />
      ))}

      <Popover placement="bottom" offset={10}>
        <PopoverTrigger>
          <MenuButton
            tooltip="插入链接"
            icon={Link}
            onPress={() => {}}
            ariaLabel="插入链接"
          />
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
                onPress={() => {
                  call(toggleLinkCommand.key, { href: link })
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

      <MenuButton
        tooltip="上传图片"
        icon={ImagePlus}
        onPress={() => uploadImageInputRef.current?.click()}
        ariaLabel="上传图片"
      />
      <input
        ref={uploadImageInputRef}
        type="file"
        accept=".jpg, .jpeg, .png, .webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
