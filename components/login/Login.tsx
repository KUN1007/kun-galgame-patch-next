'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button, Divider, Link } from '@nextui-org/react'
import { api } from '~/trpc/react'

const loginSchema = z.object({
  name: z.string().email().or(z.string().min(1).max(17)),
  password: z.string().min(6)
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginForm: React.FC = () => {
  const utils = api.useUtils()

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: '',
      password: ''
    }
  })

  const login = api.login.login.useMutation({
    onSuccess: async () => {
      // TODO:
      await utils.login.invalidate()
    }
  })

  return (
    <form
      onSubmit={handleSubmit((data) => login.mutate(data))}
      className="w-72"
    >
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            isRequired
            label="用户名或邮箱"
            type="text"
            variant="bordered"
            autoComplete="username"
            errorMessage={error?.message}
            className="mb-4"
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            isRequired
            label="密码"
            type="password"
            variant="bordered"
            autoComplete="current-password"
            errorMessage={error?.message}
            className="mb-4"
          />
        )}
      />
      <Button type="submit" color="primary" className="w-full">
        登录
      </Button>

      <div className="flex items-center justify-center overflow-hidden w-72">
        <Divider className="my-8" />
        <span className="mx-4">或</span>
        <Divider className="my-8" />
      </div>

      <Button color="primary" variant="bordered" className="w-full mb-4">
        忘记密码
      </Button>

      <div className="flex items-center">
        <span className="mr-2">没有账号?</span>
        <Link href="register">注册账号</Link>
      </div>
    </form>
  )
}
