import { Suspense } from 'react'
import { CheckHash } from './CheckHash'
import { KunHeader } from '../kun/Header'

export const CheckHashContainer = () => {
  return (
    <Suspense>
      <div className="w-full my-4">
        <KunHeader
          name="BLAKE3 文件校验"
          description="您可以输入文件的 Hash, 然后上传文件以快速使用 BLAKE3 算法检查文件完好性"
        />
        <CheckHash />
      </div>
    </Suspense>
  )
}
