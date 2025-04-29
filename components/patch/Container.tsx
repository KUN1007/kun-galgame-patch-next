'use client'

import { Alert, Button } from '@nextui-org/react'
import { useState } from 'react'
import { PatchHeaderContainer } from '~/components/patch/header/Container'
import { Patch, PatchIntroduction } from '~/types/api/patch'

interface Props {
  children: React.ReactNode
  patch: Patch
  intro: PatchIntroduction
}

// TODO:
export const PatchContainer = ({ children, patch, intro }: Props) => {
  const [show, setShow] = useState(false)

  if (patch.content_limit === 'nsfw') {
    return (
      <div className="container py-6 mx-auto space-y-6">
        {!show && (
          <div className="flex flex-col items-center">
            <Alert
              color="primary"
              title="确认显示"
              description="网站目前正在索引中, NSFW 的内容请您点击确定后即可显示, 此行为约在 1 ~ 2 周后复原"
              endContent={
                <Button color="primary" onPress={() => setShow(!show)}>
                  确定
                </Button>
              }
            />
          </div>
        )}

        {show && (
          <>
            <PatchHeaderContainer patch={patch} intro={intro} />
            {children}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="container py-6 mx-auto space-y-6">
      <PatchHeaderContainer patch={patch} intro={intro} />
      {children}
    </div>
  )
}
