'use client'

import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card'
import { Textarea } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { useUserStore } from '~/store/userStore'
import { useState } from 'react'
import { api } from '~/lib/trpc-client'
import { bioSchema } from '~/validations/user'
import toast from 'react-hot-toast'

export const Bio = () => {
  const { user, setUser } = useUserStore()
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')

  const handleSave = async () => {
    const result = bioSchema.safeParse(bio)
    if (!result.success) {
      setError(result.error.errors[0].message)
    } else {
      setError('')
      setUser({ ...user, bio })

      await api.user.updateBio.mutate(bio)
      toast.success('更新签名成功')
      setBio('')
    }
  }

  return (
    <Card className="w-full text-sm">
      <CardHeader>
        <h2 className="text-xl font-medium">签名</h2>
      </CardHeader>
      <CardBody className="py-0 space-y-4">
        <div>
          <p>这是您的签名设置, 您的签名将会被显示在您的主页上</p>
        </div>
        <Textarea
          label="签名"
          autoComplete="text"
          defaultValue={user.bio}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          isInvalid={!!error}
          errorMessage={error}
        />
      </CardBody>

      <CardFooter>
        <p className="text-gray-500">签名最大长度为 107, 可以是任意字符</p>

        <Button
          color="primary"
          variant="solid"
          className="ml-auto"
          onClick={handleSave}
        >
          保存
        </Button>
      </CardFooter>
    </Card>
  )
}
