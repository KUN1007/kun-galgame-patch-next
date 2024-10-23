'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button, Divider, Link, Checkbox } from '@nextui-org/react'
import { api } from '~/trpc/react'

const registerSchema = z.object({
  name: z.string().min(1).max(17),
  email: z.string().email(),
  password: z.string().min(6).max(107)
})

type RegisterFormData = z.infer<typeof registerSchema>

export const RegisterForm: React.FC = () => {
  const utils = api.useUtils()

  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  })

  const register = api.login.register.useMutation({
    onSuccess: async () => {
      // TODO:
      await utils.login.invalidate()
    }
  })

  return (
    <form
      onSubmit={handleSubmit((data) => register.mutate(data))}
      className="flex flex-col items-center justify-center w-72"
    >
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            isRequired
            label="用户名"
            type="name"
            variant="bordered"
            autoComplete="username"
            errorMessage={error?.message}
            className="mb-4"
          />
        )}
      />
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            isRequired
            label="邮箱"
            type="email"
            variant="bordered"
            autoComplete="email"
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

      <Checkbox className="mb-2">
        <span>我同意</span>
        <Link>鲲 Galgame 补丁用户协议</Link>
      </Checkbox>

      <Button type="submit" color="primary" className="w-full">
        注册
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
        <span className="mr-2">已经有账号了?</span>
        <Link href="/login">登录账号</Link>
      </div>
    </form>
  )
}
