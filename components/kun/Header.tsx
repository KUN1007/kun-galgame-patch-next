import { Divider } from '@nextui-org/divider'

interface Props {
  name: string
  description?: string
  endContent?: React.ReactNode
  headerEndContent?: React.ReactNode
}

export const KunHeader = ({
  name,
  description,
  endContent,
  headerEndContent
}: Props) => {
  return (
    <>
      <div className="space-y-2">
        <h1 className="flex justify-between text-2xl font-medium">
          <span>{name}</span>
          {headerEndContent}
        </h1>
        {description && <p className="text-default-500">{description}</p>}
        {endContent}
      </div>
      <Divider className="my-8" />
    </>
  )
}
