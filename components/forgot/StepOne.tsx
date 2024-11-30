'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button } from '@nextui-org/react'
import { User } from 'lucide-react'
import { kunFetchPost } from '~/utils/kunFetch'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import toast from 'react-hot-toast'
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

    const res = await kunFetchPost<KunResponse<undefined>>('/forgot/one', {
      name: data.name
    })
    useErrorHandler(res, () => {
      setEmail(data.name)
      setStep(2)
      toast.success('重置验证码发送成功!')
    })

    setLoading(false)
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
