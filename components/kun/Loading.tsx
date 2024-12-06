import { Spinner } from '@nextui-org/spinner'

interface Props {
  hint: string
}

export const KunLoading = ({ hint }: Props) => {
  return (
    <div className="flex h-64 w-full items-center justify-center space-x-2">
      <Spinner color="primary" size="lg" />
      <span>{hint}</span>
    </div>
  )
}
