import { Divider } from '@nextui-org/divider'

interface Props {
  text: string
}

export const KunTextDivider = ({ text }: Props) => {
  return (
    <div className="flex items-center justify-center w-full overflow-hidden">
      <Divider className="my-8" />
      <span className="mx-4 whitespace-nowrap text-default-500">{text}</span>
      <Divider className="my-8" />
    </div>
  )
}
