import { GalgameCard } from '~/components/galgame/Card'

interface Props {
  patches: GalgameCard[]
}

export const PatchList = ({ patches }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-2 mx-auto mb-8 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {patches.map((patch) => (
        <GalgameCard key={patch.id} patch={patch} />
      ))}
    </div>
  )
}
