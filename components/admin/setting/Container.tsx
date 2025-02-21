import { DisableRegisterSetting } from './DisableRegisterSetting'
import { EnableCommentVerify } from './EnableCommentVerify'

interface Props {
  disableRegister: boolean
  enableCommentVerify: boolean
}

export const AdminSetting = ({
  disableRegister,
  enableCommentVerify
}: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">网站设置</h1>
      </div>

      <DisableRegisterSetting disableRegister={disableRegister} />

      <EnableCommentVerify enableCommentVerify={enableCommentVerify} />
    </div>
  )
}
