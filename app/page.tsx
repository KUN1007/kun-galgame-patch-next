'use client'

import { LoginForm } from '~/components/Login'
import { RegisterForm } from '~/components/Register'
import { Card, CardBody, CardHeader, Divider } from '@nextui-org/react'

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="flex justify-center">
          <h1 className="text-2xl font-bold">Welcome</h1>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold">Login</h2>
              <LoginForm />
            </div>
            <Divider />
            <div>
              <h2 className="mb-2 text-xl font-semibold">Register</h2>
              <RegisterForm />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
