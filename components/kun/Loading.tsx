import { Spinner } from '@nextui-org/spinner'

export const KunLoading = () => {
  return (
    <div className="flex items-center justify-center w-full h-64 space-x-2">
      <Spinner color="primary" size="lg" />
      <span>正在加载编辑器</span>
    </div>
  )
}
