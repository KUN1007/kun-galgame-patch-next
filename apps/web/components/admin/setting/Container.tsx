import { DisableRegisterSetting } from './DisableRegisterSetting'
import { EnableCommentVerify } from './EnableCommentVerify'
import { EnableOnlyCreatorCreateGalgame } from './EnableOnlyCreatorCreateGalgame'

interface Props {
  disableRegister: boolean
  enableCommentVerify: boolean
  enableOnlyCreatorCreate: boolean
}

export const AdminSetting = ({
  disableRegister,
  enableCommentVerify,
  enableOnlyCreatorCreate
}: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">网站设置</h1>
      </div>

      <DisableRegisterSetting disableRegister={disableRegister} />

      <EnableCommentVerify enableCommentVerify={enableCommentVerify} />

      <EnableOnlyCreatorCreateGalgame
        enableOnlyCreatorCreate={enableOnlyCreatorCreate}
      />
    </div>
  )
}
