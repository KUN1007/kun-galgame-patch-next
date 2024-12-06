'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { Divider } from '@nextui-org/react'
import { LockKeyhole } from 'lucide-react'
import { StepOne } from './StepOne'
import { StepTwo } from './StepTwo'

export const ForgotPassword = () => {
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')

  return (
    <Card className="m-auto w-80">
      <CardHeader className="flex flex-col gap-2 p-6">
        <div className="mx-auto rounded-full bg-primary/10 p-3">
          <LockKeyhole className="size-6 text-primary" />
        </div>
        <h1 className="text-center text-2xl font-bold">重置密码</h1>
        <p className="text-center text-sm text-default-500">
          {step === 1
            ? '输入您的用户名或邮箱以发送邮箱验证码'
            : '请输入您收到的验证码和新密码'}
        </p>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-4 p-6">
        {step === 1 ? (
          <StepOne setStep={setStep} setEmail={setUsername} />
        ) : (
          <StepTwo name={username} setStep={setStep} />
        )}
      </CardBody>
    </Card>
  )
}
