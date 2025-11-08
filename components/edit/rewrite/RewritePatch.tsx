'use client'

import { useState } from 'react'
import { Button, Card, CardBody, CardHeader } from '@heroui/react'
import { useRewritePatchStore } from '~/store/rewriteStore'
import toast from 'react-hot-toast'
import { kunFetchPut } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { patchUpdateSchema } from '~/validations/edit'
import { useRouter } from '@bprogress/next'
import { VNDBInput } from './VNDBInput'
import { ReleaseDateInput } from '../components/ReleaseDateInput'
import { AliasManager } from './AliasManager'
import { ContentLimit } from './ContentLimit'
import { TabbedIntroduction } from '../shared/TabbedIntroduction'
import { MultiLangNameInput } from '../shared/MultiLangNameInput'

export const RewritePatch = () => {
  const router = useRouter()
  const { data, setData } = useRewritePatchStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addAlias = (newAlias: string) => {
    const alias = newAlias.trim().toLowerCase()
    if (data.alias.includes(alias)) {
      toast.error('别名已存在')
      return
    }
    if (newAlias.trim()) {
      setData({ ...data, alias: [...data.alias, alias] })
    }
  }

  const [rewriting, setRewriting] = useState(false)
  const handleSubmit = async () => {
    const payload = {
      id: data.id,
      vndbId: data.vndbId,
      name_zh_cn: data.name['zh-cn'],
      name_ja_jp: data.name['ja-jp'],
      name_en_us: data.name['en-us'],
      introduction_zh_cn: data.introduction['zh-cn'],
      introduction_ja_jp: data.introduction['ja-jp'],
      introduction_en_us: data.introduction['en-us'],
      alias: data.alias,
      contentLimit: data.contentLimit,
      released: data.released
    }
    const result = patchUpdateSchema.safeParse(payload)
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path.length) newErrors[String(err.path[0])] = err.message
      })
      setErrors(newErrors)
      toast.error('表单校验失败，请检查输入')
      return
    } else {
      setErrors({})
    }

    setRewriting(true)

    const res = kunFetchPut<KunResponse<{}>>('/edit', payload)
    kunErrorHandler(res, async () => {
      router.push(`/patch/${data.id}/introduction`)
    })
    toast.success('修改成功')
    setRewriting(false)
  }

  return (
    <form className="flex-1 w-full p-4 mx-auto">
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-2xl">重新编辑</p>
            <p className="text-small text-default-500">
              请尽量填写完整，方便后续同步
            </p>
          </div>
        </CardHeader>
        <CardBody className="mt-4 space-y-12">
          <VNDBInput
            vndbId={data.vndbId}
            setVNDBId={(id) =>
              setData({
                ...data,
                vndbId: id
              })
            }
            errors={errors.vndbId}
          />

          <MultiLangNameInput
            name={data.name}
            onChange={(name) => setData({ ...data, name })}
            error={errors.name}
          />

          <TabbedIntroduction storeName="patchRewrite" initialLang="zh-cn" />

          <ReleaseDateInput
            date={data.released}
            setDate={(date) => {
              setData({ ...data, released: date })
            }}
            errors={errors.released}
          />

          <AliasManager
            aliasList={data.alias}
            onAddAlias={addAlias}
            onRemoveAlias={(index) =>
              setData({
                ...data,
                alias: data.alias.filter((_, i) => i !== index)
              })
            }
            errors={errors.alias}
          />

          <ContentLimit errors={errors.contentLimit} />

          <Button
            color="primary"
            className="w-full mt-4"
            onPress={handleSubmit}
            isLoading={rewriting}
            isDisabled={rewriting}
          >
            提交
          </Button>
        </CardBody>
      </Card>
    </form>
  )
}
