'use client'

import Image from 'next/image'
import { LoginForm } from '~/components/login/Login'

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center w-96">
      <Image
        src="/placeholder.webp"
        alt="鲲 Galgame 补丁"
        priority={true}
        width={500}
        height={300}
        className="w-96"
      />
      <LoginForm />
    </div>
  )
}
