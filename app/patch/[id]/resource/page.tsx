import { ErrorComponent } from '~/components/error/ErrorComponent'
import type { Patch } from '~/types/api/patch'

export default async function Patch({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // const { id } = await params

  console.log(params)

  // if (isNaN(Number(id))) {
  //   return <ErrorComponent error={'提取页面参数错误'} />
  // }
  return <div className="container py-8 mx-auto"></div>
}
