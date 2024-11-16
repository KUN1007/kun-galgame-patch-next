import { Spinner } from '@nextui-org/spinner'

interface Props {
  hint: string
}

export const KunLoading = ({ hint }: Props) => {
  return (
    <div className="flex items-center justify-center w-full h-64 space-x-2">
      <Spinner color="primary" size="lg" />
      <span>{hint}</span>
    </div>
  )
}
