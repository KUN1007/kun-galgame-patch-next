'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card'
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { Mail, KeyRound } from 'lucide-react'
import { useUserStore } from '~/store/userStore'
import { EmailVerification } from '~/components/kun/verification-code/Code'
import { resetEmailSchema } from '~/validations/user'
import { api } from '~/lib/trpc-client'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import toast from 'react-hot-toast'

type EmailFormData = z.infer<typeof resetEmailSchema>

export const Email = () => {
  const { user, setUser } = useUserStore()
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<EmailFormData>({
    resolver: zodResolver(resetEmailSchema),
    defaultValues: {
      email: '',
      code: ''
    }
  })

  const onSubmit = async (data: EmailFormData) => {
    setLoading(true)
    const res = await api.user.updateEmail.mutate(data)
    setLoading(false)

    useErrorHandler(res, () => {
      reset()
      toast.success('更新邮箱成功!')
      setUser({ ...user, email: data.email })
    })
  }

  return (
    <Card className="w-full text-sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <h2 className="text-xl font-medium">邮箱</h2>
        </CardHeader>
        <CardBody className="py-0 space-y-4">
          <div>
            <p>这是您的邮箱设置, 您的邮箱将会被用于恢复您的密码</p>
            <p>
              点击发送验证码, 您的新邮箱中将会收到一封包含验证码的邮件,
              请填写新邮箱中收到的验证码
            </p>
          </div>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                placeholder="请输入您的新邮箱"
                startContent={
                  <Mail className="flex-shrink-0 text-2xl pointer-events-none text-default-400" />
                }
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
              />
            )}
          />
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder="新邮箱验证码"
                startContent={
                  <KeyRound className="flex-shrink-0 text-2xl pointer-events-none text-default-400" />
                }
                endContent={
                  <EmailVerification
                    username=""
                    email={watch().email}
                    type="email"
                  />
                }
                isInvalid={!!errors.code}
                errorMessage={errors.code?.message}
              />
            )}
          />
        </CardBody>
        <CardFooter className="flex-wrap">
          <p className="text-gray-500">
            如果您的新邮箱未收到验证码, 请检查垃圾邮件或者全部邮件
          </p>
          <Button
            type="submit"
            color="primary"
            variant="solid"
            className="ml-auto"
            isLoading={loading}
          >
            保存
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
