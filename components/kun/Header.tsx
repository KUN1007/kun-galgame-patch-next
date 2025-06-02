import { Divider } from '@heroui/divider'
import { Image } from '@heroui/image'

interface Props {
  name: string
  image?: string
  description?: string
  isShowDivider?: boolean
  endContent?: React.ReactNode
  headerEndContent?: React.ReactNode
}

export const KunHeader = ({
  name,
  image,
  description,
  isShowDivider = true,
  endContent,
  headerEndContent
}: Props) => {
  return (
    <>
      <div className="space-y-2">
        {image && image !== '' && (
          <div className="flex justify-center my-10">
            <Image
              isBlurred
              src={image}
              alt={name}
              className="max-h-40"
              classNames={{ blurredImg: 'scale-125' }}
            />
          </div>
        )}
        <div className="flex justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-medium">
              <span>{name}</span>
            </h1>
            {description && (
              <p className="whitespace-pre-wrap text-default-500">
                {description}
              </p>
            )}
          </div>
          {headerEndContent}
        </div>
        {endContent}
      </div>
      {isShowDivider && <Divider className="my-8" />}
    </>
  )
}
