'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardBody, CardFooter, CardHeader } from '@nextui-org/card'
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { KeyRound, Mail } from 'lucide-react'
import { EmailVerification } from '~/components/kun/verification-code/Code'
import { resetEmailSchema } from '~/validations/user'
import { kunFetchPost } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import toast from 'react-hot-toast'

type EmailFormData = z.infer<typeof resetEmailSchema>

export const Email = () => {
  const [loading, setLoading] = useState(false)

  const {
    control,
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

  const handleUpdateEmail = async () => {
    setLoading(true)

    const res = await kunFetchPost<KunResponse<{}>>(
      '/user/setting/email',
      watch()
    )
    kunErrorHandler(res, () => {
      reset()
      toast.success('更新邮箱成功!')
    })

    setLoading(false)
  }

  return (
    <Card className="w-full text-sm">
      <form>
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
                  <Mail className="text-2xl pointer-events-none shrink-0 text-default-400" />
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
                  <KeyRound className="text-2xl pointer-events-none shrink-0 text-default-400" />
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
            color="primary"
            variant="solid"
            className="ml-auto"
            isLoading={loading}
            onPress={handleUpdateEmail}
          >
            保存
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
