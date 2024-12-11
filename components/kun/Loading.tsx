import { Spinner } from '@nextui-org/spinner'
import { cn } from '~/utils/cn'

interface Props {
  hint: string
  className?: string
}

export const KunLoading = ({ hint, className }: Props) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center space-x-2 size-full',
        className
      )}
    >
      <Spinner color="primary" size="lg" />
      <span>{hint}</span>
    </div>
  )
}
