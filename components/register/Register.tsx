'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Checkbox, Divider, Input, Link } from '@nextui-org/react'
import { kunFetchPost } from '~/utils/kunFetch'
import { registerSchema } from '~/validations/auth'
import { useUserStore } from '~/store/providers/user'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { redirect } from 'next/navigation'
import toast from 'react-hot-toast'
import { EmailVerification } from '~/components/kun/verification-code/Code'
import { useRouter } from 'next-nprogress-bar'
import { KunTextDivider } from '~/components/kun/TextDivider'
import type { UserState } from '~/store/userStore'

type RegisterFormData = z.infer<typeof registerSchema>

export const RegisterForm = () => {
  const { setUser } = useUserStore((state) => state)
  const router = useRouter()
  const [isAgree, setIsAgree] = useState(false)
  const [loading, setLoading] = useState(false)

  const { control, watch, reset } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      code: '',
      password: ''
    }
  })

  const handleRegister = async () => {
    if (!isAgree) {
      toast.error('请您勾选同意我们的用户协议')
      return
    }

    setLoading(true)
    const res = await kunFetchPost<KunResponse<UserState>>(
      '/auth/register',
      watch()
    )

    setLoading(false)

    kunErrorHandler(res, (value) => {
      setUser(value)
      reset()
      toast.success('注册成功!')
      redirect(`/user/${value.uid}`)
    })
  }

  return (
    <form className="flex flex-col w-72">
      <Controller
        name="name"
        control={control}
        render={({ field, formState: { errors } }) => (
          <Input
            {...field}
            isRequired
            label="用户名"
            type="name"
            variant="bordered"
            autoComplete="username"
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message}
            className="mb-4"
          />
        )}
      />
      <Controller
        name="email"
        control={control}
        render={({ field, formState: { errors } }) => (
          <Input
            {...field}
            isRequired
            label="邮箱"
            type="email"
            variant="bordered"
            autoComplete="email"
            isInvalid={!!errors.email}
            errorMessage={errors.email?.message}
            className="mb-4"
          />
        )}
      />
      <Controller
        name="code"
        control={control}
        render={({ field, formState: { errors, defaultValues } }) => (
          <Input
            {...field}
            isRequired
            label="验证码"
            type="text"
            variant="bordered"
            isInvalid={!!errors.code}
            errorMessage={errors.code?.message}
            autoComplete="one-time-code"
            className="mb-4"
            endContent={
              <EmailVerification
                username={watch().name}
                email={watch().email}
                type="register"
              />
            }
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
            autoComplete="current-password"
            isInvalid={!!errors.password}
            errorMessage={errors.password?.message}
            className="mb-4"
          />
        )}
      />

      <Checkbox
        className="mb-2"
        isSelected={isAgree}
        onValueChange={setIsAgree}
      >
        <span>我同意</span>
        <Link className="ml-1" href="/about/notice/privacy">
          鲲 Galgame 补丁用户协议
        </Link>
      </Checkbox>

      <Button
        color="primary"
        className="w-full"
        isLoading={loading}
        onPress={handleRegister}
      >
        注册
      </Button>

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
        <span className="mr-2">已经有账号了?</span>
        <Link href="/login">登录账号</Link>
      </div>
    </form>
  )
}
