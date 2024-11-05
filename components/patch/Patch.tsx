// import { useEffect } from 'react'
// import { PatchHeader } from '~/components/patch/Header'
// import { PatchDetails } from '~/components/patch/Details'
// import { ErrorComponent } from '~/components/error/ErrorComponent'
// import { api } from '~/lib/trpc-client'

// export const Home = ({ pid }: { pid: number }) => {
//   if (isNaN(Number(pid))) {
//     return <ErrorComponent error={'提取页面参数错误'} />
//   }

//   const res = await api.patch.getPatchById.query({ id: Number(pid) })
//   if (!res || typeof res === 'string') {
//     return <ErrorComponent error={res} />
//   }

//   return (
//     <div className="container py-8 mx-auto space-y-8">
//       <PatchHeader patch={res} />
//       <PatchDetails patch={res} />
//     </div>
//   )
// }
