'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button } from '@nextui-org/react'
import { api } from '~/lib/trpc-client'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginForm: React.FC = () => {
  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    await api.login.login.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Email"
            type="email"
            errorMessage={error?.message}
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Password"
            type="password"
            errorMessage={error?.message}
          />
        )}
      />
      <Button type="submit" color="primary">
        Login
      </Button>
    </form>
  )
}
