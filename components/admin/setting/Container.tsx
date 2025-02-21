import { DisableRegisterSetting } from './DisableRegisterSetting'

interface Props {
  disableRegister: boolean
}

export const AdminSetting = ({ disableRegister }: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">网站设置</h1>
      </div>

      <DisableRegisterSetting disableRegister={disableRegister} />
    </div>
  )
}
