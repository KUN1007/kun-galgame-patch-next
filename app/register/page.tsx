'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button } from '@nextui-org/react'
import { api } from '~/lib/trpc-client'

const registerSchema = z.object({
  name: z.string().min(1).max(17),
  email: z.string().email(),
  password: z.string().min(6).max(107)
})

type RegisterFormData = z.infer<typeof registerSchema>

const Register: React.FC = () => {
  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: RegisterFormData) => {
    await api.login.register.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Name"
            type="name"
            autoComplete="username"
            errorMessage={error?.message}
          />
        )}
      />
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Email"
            type="email"
            autoComplete="email"
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
            autoComplete="current-password"
            errorMessage={error?.message}
          />
        )}
      />
      <Button type="submit" color="primary">
        Register
      </Button>
    </form>
  )
}

export default Register
