import { Divider } from '@nextui-org/divider'

interface Props {
  name: string
  description: string
}

export const KunHeader = ({ name, description }: Props) => {
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-medium">{name}</h1>
        <p className="text-default-500">{description}</p>
      </div>
      <Divider className="my-8" />
    </>
  )
}
