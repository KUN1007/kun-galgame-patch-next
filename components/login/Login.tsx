import { z } from 'zod'
import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button, Divider, Link } from '@nextui-org/react'
import { api } from '~/lib/trpc-client'
import { loginSchema } from '~/validations/auth'
import { useUserStore } from '~/store/userStore'
import { useErrorHandler } from '~/hooks/useErrorHandler'

type LoginFormData = z.infer<typeof loginSchema>

export const LoginForm: React.FC = () => {
  const userStore = useUserStore()

  const { control, handleSubmit, reset } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    const res = await api.auth.login.mutate(data)
    useErrorHandler(res, (value) => {
      userStore.login(value)
      reset()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-72">
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
