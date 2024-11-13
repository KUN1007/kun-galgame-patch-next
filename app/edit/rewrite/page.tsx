import { PatchRewriteForm } from '~/components/edit/rewrite/RewritePatch'

export default async function PatchRewrite({
  searchParams
}: {
  searchParams: Promise<{ patchId: string }>
}) {
  const res = await searchParams
  console.log(res)

  return (
    <div className="flex items-center justify-center flex-1 max-w-5xl mx-auto w-96">
      <PatchRewriteForm />
    </div>
  )
}
