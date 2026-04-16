import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunGetPatchActions, kunUpdatePatchViewsActions } from './actions'
import { PatchContainer } from '~/components/patch/Container'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function Kun({ params, children }: Props) {
  const { id } = await params

  if (isNaN(Number(id))) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }

  const [patch, intro] = await Promise.all([
    kunGetPatchActions({
      patchId: Number(id)
    }),
    kunUpdatePatchViewsActions({ patchId: Number(id) })
  ])
  if (typeof patch === 'string') {
    return <ErrorComponent error={patch} />
  }

  if (typeof intro === 'string') {
    return <ErrorComponent error={intro} />
  }

  const payload = await verifyHeaderCookie()

  return (
    <PatchContainer patch={patch} uid={payload?.uid}>
      {children}
    </PatchContainer>
  )
}
