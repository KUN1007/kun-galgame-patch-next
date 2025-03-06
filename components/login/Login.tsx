'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Link, useDisclosure } from '@nextui-org/react'
import { kunFetchPost } from '~/utils/kunFetch'
import { loginSchema } from '~/validations/auth'
import { useUserStore } from '~/store/userStore'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { useRouter } from 'next-nprogress-bar'
import toast from 'react-hot-toast'
import { KunCaptchaModal } from '~/components/kun/auth/CaptchaModal'
import { KunTextDivider } from '~/components/kun/TextDivider'
import type { UserState } from '~/store/userStore'

type LoginFormData = z.infer<typeof loginSchema>

export const LoginForm = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { setUser } = useUserStore((state) => state)
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { control, watch, reset } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: '',
      password: ''
    }
  })

  const handleCaptchaSuccess = async (code: string) => {
    onClose()

    setLoading(true)
    const res = await kunFetchPost<KunResponse<UserState>>('/auth/login', {
      ...watch(),
      captcha: code
    })
    setLoading(false)

    kunErrorHandler(res, (value) => {
      setUser(value)
      reset()
      toast.success('登录成功!')
      router.push(`/user/${value.uid}/resource`)
    })
  }

  return (
    <form className="w-72">
      <Controller
        name="name"
        control={control}
        render={({ field, formState: { errors } }) => (
          <Input
            {...field}
            isRequired
            label="用户名或邮箱"
            type="text"
            variant="bordered"
            autoComplete="username"
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message}
            className="mb-4"
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        render={({ field, formState: { errors } }) => (
          <Input
            {...field}
            isRequired
            label="密码"
            type="password"
            variant="bordered"
            isInvalid={!!errors.password}
            autoComplete="current-password"
            errorMessage={errors.password?.message}
            className="mb-4"
          />
        )}
      />
      <Button
        color="primary"
        className="w-full"
        isDisabled={loading}
        isLoading={loading}
        onPress={onOpen}
      >
        登录
      </Button>

      <KunCaptchaModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleCaptchaSuccess}
      />

      <KunTextDivider text="或" />

      <Button
        color="primary"
        variant="bordered"
        className="w-full mb-4"
        onPress={() => router.push('/auth/forgot')}
      >
        忘记密码
      </Button>

      <div className="flex items-center">
        <span className="mr-2">没有账号?</span>
        <Link href="register">注册账号</Link>
      </div>
    </form>
  )
}
