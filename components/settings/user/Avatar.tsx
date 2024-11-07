'use client'

import { Card, CardBody, CardFooter } from '@nextui-org/card'
import { Camera } from 'lucide-react'
import { Avatar } from '@nextui-org/avatar'
import { useUserStore } from '~/store/userStore'

export const UserAvatar = () => {
  const { user } = useUserStore()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      // reader.onloadend = () => {
      //   setValue('avatar', reader.result as string)
      // }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card className="w-full text-sm">
      <CardBody className="flex flex-row items-center justify-between gap-4 pb-0">
        <div>
          <h2 className="mb-4 text-xl font-medium">头像</h2>
          <p>这是您的头像设置</p>
          <p>您可以点击头像以上传图片文件</p>
        </div>

        <div className="relative group">
          <Avatar
            name={user.name}
            src={user.avatar}
            className="w-16 h-16"
            color="primary"
          />

          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 cursor-pointer bg-black/50 group-hover:opacity-100"
          >
            <Camera className="w-6 h-6 text-white" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </CardBody>

      <CardFooter>
        <p className="py-2 text-gray-500">
          头像不是必须, 但是我们强烈推荐设置头像
        </p>
      </CardFooter>
    </Card>
  )
}
