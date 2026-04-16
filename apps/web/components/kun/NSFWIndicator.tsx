import { Alert } from '@heroui/alert'

interface Props {
  isNSFWEnable: boolean
}

export const NSFWIndicator = ({ isNSFWEnable }: Props) => {
  const titleString = isNSFWEnable ? 'NSFW 已启用' : 'NSFW 未启用'
  const description = isNSFWEnable
    ? '网站已启用 NSFW, 请注意您周围没有人'
    : '网站未启用 NSFW, 部分补丁内容不可见, 请在网站右上角打开 NSFW'

  return (
    <div className="w-full px-3 max-w-7xl">
      <Alert
        color={isNSFWEnable ? 'danger' : 'default'}
        title={titleString}
        description={description}
      />
    </div>
  )
}
