import Image from 'next/image'
import { RegisterForm } from '~/components/register/Register'

export default function Kun() {
  return (
    <div className="flex flex-col items-center justify-center mx-auto w-96">
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
