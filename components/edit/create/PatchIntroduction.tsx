'use client'

import { useCreatePatchStore } from '~/store/editStore'
import { TabbedIntroduction } from '../shared/TabbedIntroduction'

interface Props {
  errors: string | undefined
}

export const PatchIntroduction = ({ errors }: Props) => {
  const { data } = useCreatePatchStore()
  const getCurText = () =>
    data.introduction['zh-cn'] ||
    data.introduction['ja-jp'] ||
    data.introduction['en-us'] ||
    ''
  return (
    <TabbedIntroduction
      storeName="patchCreate"
      errors={errors}
      initialLang="zh-cn"
      getCurrentText={getCurText}
    />
  )
}
