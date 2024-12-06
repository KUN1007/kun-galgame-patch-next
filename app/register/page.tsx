'use client'

import Image from 'next/image'
import { RegisterForm } from '~/components/register/Register'

export default function Login() {
  return (
    <div className="mx-auto flex w-96 flex-col items-center justify-center">
      <Image
        src="/placeholder.webp"
        alt="鲲 Galgame 补丁"
        priority={true}
        width={500}
        height={300}
        className="w-96"
      />
      <RegisterForm />
    </div>
  )
}
