import { Profile } from '~/components/user/Profile'

export default async function User({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="w-full py-8 mx-auto">
      <Profile id={Number(id)} />
    </div>
  )
}
