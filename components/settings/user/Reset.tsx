import { Card, CardBody, CardFooter, CardHeader } from '@nextui-org/card'
import { Button } from '@nextui-org/button'

export const Reset = () => {
  return (
    <Card className="w-full text-sm">
      <CardHeader>
        <h2 className="text-xl font-medium">清除网站数据</h2>
      </CardHeader>
      <CardBody className="py-0 space-y-4">
        <div>
          <p>
            如果您的网站出现任何报错, 例如本页面中的消息通知无法点击,
            可以尝试清除网站所有数据。清除网站数据将会清除您所有的 Galgame
            发布草稿, 并且需要重新登录, 清除操作不会对您的账户信息产生任何影响
          </p>
        </div>
      </CardBody>

      <CardFooter className="flex-wrap">
        <p className="text-danger-500">注意, 清除操作无法撤销</p>

        <Button color="danger" variant="solid" className="ml-auto">
          清除
        </Button>
      </CardFooter>
    </Card>
  )
}
