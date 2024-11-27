import { Card } from '@nextui-org/card'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function SuccessPage() {
  return (
    <Card className="w-full max-w-md p-8 mx-auto my-8 text-center">
      <div className="flex justify-center mb-4">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
      </div>
      <h1 className="mb-4 text-2xl font-bold">Application Submitted!</h1>
      <p className="mb-6 text-gray-600">
        Thank you for applying to become a creator. We'll review your
        application and get back to you soon.
      </p>
      <Link
        href="/"
        className="font-medium text-primary-500 hover:text-primary-600"
      >
        Return to Home
      </Link>
    </Card>
  )
}
