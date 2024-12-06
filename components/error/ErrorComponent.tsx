'use client'

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader
} from '@nextui-org/react'
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'

interface ErrorComponentProps {
  error: string
}

export const ErrorComponent = ({ error }: ErrorComponentProps) => {
  const router = useRouter()

  return (
    <div className="flex size-full items-center justify-center p-8">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="flex gap-3 px-8 pt-8">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-danger-50 p-3">
              <AlertTriangle className="size-8 text-danger" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">出错了</h1>
              <p className="text-default-500">发生了一些意外情况</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-8">
          <div className="mt-4 rounded-lg bg-danger-50 p-4">
            <p className="font-mono text-sm text-danger">{error}</p>
          </div>
        </CardBody>
        <CardFooter className="flex flex-wrap gap-2 px-8 pb-8">
          <Button
            startContent={<ArrowLeft className="size-4" />}
            variant="flat"
            color="primary"
            onClick={() => router.back()}
          >
            返回上一页
          </Button>
          <Button
            startContent={<Home className="size-4" />}
            color="primary"
            onClick={() => router.push('/')}
          >
            返回首页
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
