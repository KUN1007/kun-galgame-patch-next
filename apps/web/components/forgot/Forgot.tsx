'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Divider } from '@heroui/react'
import { LockKeyhole } from 'lucide-react'
import { StepOne } from './StepOne'
import { StepTwo } from './StepTwo'

export const ForgotPassword = () => {
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')

  return (
    <Card className="m-auto w-80">
      <CardHeader className="flex flex-col gap-2 p-6">
        <div className="p-3 mx-auto rounded-full bg-primary/10">
          <LockKeyhole className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-center">重置密码</h1>
        <p className="text-sm text-center text-default-500">
          {step === 1
            ? '输入您的邮箱以发送邮箱验证码'
            : '请输入您收到的验证码和新密码'}
        </p>
      </CardHeader>
      <Divider />
      <CardBody className="p-6 space-y-4">
        {step === 1 ? (
          <StepOne setStep={setStep} setEmail={setUsername} />
        ) : (
          <StepTwo name={username} setStep={setStep} />
        )}
      </CardBody>
    </Card>
  )
}
