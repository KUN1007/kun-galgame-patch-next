import { RewritePatch } from '~/components/edit/rewrite/RewritePatch'

export default async function PatchRewrite() {
  return (
    <div className="flex items-center justify-center flex-1 max-w-5xl mx-auto w-96">
      <RewritePatch />
    </div>
  )
}
