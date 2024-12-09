import { kunMetadata } from './metadata'
import { Card, CardBody, CardHeader } from '@nextui-org/card'
import Image from 'next/image'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { RegisterForm } from '~/components/register/Register'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function Kun() {
  return (
    <div className="flex items-center justify-center mx-auto">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center pt-8 space-y-6">
          <div className="flex items-center space-x-2 font-medium cursor-default text-medium text-default-500">
            <Image
              src="/favicon.webp"
              priority={true}
              alt={kunMoyuMoe.titleShort}
              width={36}
              height={36}
              className="rounded-full"
            />
            <span>{kunMoyuMoe.titleShort}</span>
          </div>

          <h1 className="text-3xl font-bold">注册</h1>
        </CardHeader>
        <CardBody className="flex justify-center px-8 py-6">
          <RegisterForm />
        </CardBody>
      </Card>
    </div>
  )
}
