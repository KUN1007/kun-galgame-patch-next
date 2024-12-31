'use client'

import { z } from 'zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@nextui-org/react'
import { KeyRound, LockKeyhole } from 'lucide-react'
import { stepTwoSchema } from '~/validations/forgot'
import { kunFetchPost } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import toast from 'react-hot-toast'
import { redirect } from 'next/navigation'
import { watch } from 'fs'

type StepTwoFormData = z.infer<typeof stepTwoSchema>

interface Props {
  name: string
  setStep: (step: number) => void
}

export const StepTwo = ({ name, setStep }: Props) => {
  const [loading, setLoading] = useState(false)

  const {
    control,
    watch,
    reset,
    formState: { errors }
  } = useForm<StepTwoFormData>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: {
      name,
      verificationCode: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const handleResetPassword = async (data: StepTwoFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('您两次输入的密码不一致, 请重新输入')
      return
    }

    setLoading(true)
    const res = await kunFetchPost<KunResponse<undefined>>('/forgot/two', {
      ...data,
      name
    })
    kunErrorHandler(res, () => {
      reset()
      toast.success('重置密码成功! 正在跳转到登录页')
      redirect('/login')
    })
    setLoading(false)
  }

  return (
    <form className="space-y-4">
      <Input
        isDisabled
        label="用户名"
        autoComplete="username"
        defaultValue={name}
        isInvalid={!!errors.name}
        errorMessage={errors.name?.message}
      />
      <Controller
        name="verificationCode"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="验证码"
            placeholder="请输入验证码"
            autoComplete="one-time-code"
            isInvalid={!!errors.verificationCode}
            errorMessage={errors.verificationCode?.message}
            startContent={<KeyRound className="size-4 text-default-400" />}
          />
        )}
      />
      <Controller
        name="newPassword"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="新密码"
            type="password"
            placeholder="请输入新密码"
            autoComplete="new-password"
            isInvalid={!!errors.newPassword}
            errorMessage={errors.newPassword?.message}
            startContent={<LockKeyhole className="size-4 text-default-400" />}
          />
        )}
      />
      <Controller
        name="confirmPassword"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="确认密码"
            type="password"
            placeholder="请再次输入新密码"
            autoComplete="new-password"
            isInvalid={!!errors.confirmPassword}
            errorMessage={errors.confirmPassword?.message}
            startContent={<LockKeyhole className="size-4 text-default-400" />}
          />
        )}
      />
      <div className="space-y-2">
        <Button
          color="primary"
          className="w-full"
          isLoading={loading}
          onPress={() => handleResetPassword(watch())}
        >
          确认重置密码
        </Button>
        <Button variant="light" className="w-full" onPress={() => setStep(1)}>
          返回
        </Button>
      </div>
    </form>
  )
}
