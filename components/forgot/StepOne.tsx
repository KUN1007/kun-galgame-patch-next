'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button } from '@nextui-org/react'
import { User } from 'lucide-react'
import { stepOneSchema } from '~/validations/forgot'

type StepOneFormData = z.infer<typeof stepOneSchema>

interface Props {
  setStep: (step: number) => void
  setEmail: (username: string) => void
}

export const StepOne = ({ setStep, setEmail }: Props) => {
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit } = useForm<StepOneFormData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      name: ''
    }
  })

  const handleSendCode = async (data: StepOneFormData) => {
    setLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    setStep(2)
    setEmail(data.name)
  }

  return (
    <form onSubmit={handleSubmit(handleSendCode)} className="w-full space-y-4">
      <Controller
        name="name"
        control={control}
        render={({ field, formState: { errors } }) => (
          <Input
            {...field}
            label="邮箱或用户名"
            placeholder="请输入您的邮箱或用户名"
            autoComplete="email"
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message}
            startContent={<User className="w-4 h-4 text-default-400" />}
          />
        )}
      />
      <Button
        type="submit"
        color="primary"
        className="w-full"
        isLoading={loading}
      >
        发送验证码
      </Button>
    </form>
  )
}
