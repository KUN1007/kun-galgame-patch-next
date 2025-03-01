'use client'

import { z } from 'zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@nextui-org/button'
import { Link } from '@nextui-org/link'
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress
} from '@nextui-org/react'
import toast from 'react-hot-toast'
import { kunFetchPost } from '~/utils/kunFetch'
import { patchResourceCreateSchema } from '~/validations/patch'
import { ResourceLinksInput } from './ResourceLinksInput'
import { ResourceDetailsForm } from './ResourceDetailsForm'
import { Upload } from 'lucide-react'
import { FileUploadContainer } from '../upload/FileUploadContainer'
import { ResourceTypeSelect } from './ResourceTypeSelect'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { useUserStore } from '~/store/providers/user'
import {
  USER_DAILY_UPLOAD_LIMIT,
  CREATOR_DAILY_UPLOAD_LIMIT
} from '~/config/upload'
import { MilkdownProvider } from '@milkdown/react'
import { KunEditor } from '~/components/kun/milkdown/Editor'
import type { PatchResourceHtml } from '~/types/api/patch'

export type ResourceFormData = z.infer<typeof patchResourceCreateSchema>

interface CreateResourceProps {
  patchId: number
  onClose: () => void
  onSuccess?: (res: PatchResourceHtml) => void
}

export const PublishResource = ({
  patchId,
  onClose,
  onSuccess
}: CreateResourceProps) => {
  const [creating, setCreating] = useState(false)
  const user = useUserStore((state) => state.user)

  const {
    control,
    reset,
    setValue,
    formState: { errors },
    watch
  } = useForm<ResourceFormData>({
    resolver: zodResolver(patchResourceCreateSchema),
    defaultValues: {
      patchId,
      storage: 's3',
      name: '',
      modelName: '',
      hash: '',
      content: '',
      code: '',
      type: [],
      language: [],
      platform: [],
      size: '',
      password: '',
      note: ''
    }
  })

  const handleRewriteResource = async () => {
    setCreating(true)
    const res = await kunFetchPost<KunResponse<PatchResourceHtml>>(
      '/patch/resource',
      watch()
    )
    setCreating(false)
    kunErrorHandler(res, (value) => {
      reset()
      onSuccess?.(value)
      toast.success('资源发布成功')
    })
  }

  const handleUploadSuccess = (
    storage: string,
    hash: string,
    content: string,
    size: string
  ) => {
    setValue('storage', storage)
    setValue('hash', hash)
    setValue('content', content)
    setValue('size', size)
  }

  const handleRemoveFile = () => {
    setValue('hash', '')
    setValue('content', '')
    setValue('size', '')
  }

  const progress = () => {
    const uploadSizeRate =
      user.dailyUploadLimit /
      (user.role > 1 ? CREATOR_DAILY_UPLOAD_LIMIT : USER_DAILY_UPLOAD_LIMIT)
    return Math.min(uploadSizeRate * 100, 100)
  }

  const userDailyStorageMB = (user.dailyUploadLimit / (1024 * 1024)).toFixed(3)

  return (
    <ModalContent>
      <ModalHeader className="flex-col space-y-2">
        <h3 className="text-lg">创建补丁资源</h3>
        <div className="space-y-2 text-sm font-medium text-default-500">
          <div className="space-y-1">
            <Link
              className="mr-4"
              underline="hover"
              href="/about/notice/patch-tutorial"
            >
              鲲 Galgame 补丁资源系统介绍
            </Link>
            <Link underline="hover" href="/about/notice/paradigm">
              鲲 Galgame 补丁资源发布规范
            </Link>
            <p>
              作为创作者, 您每天有 5GB (5120MB) 的上传额度, 该额度每天早上 8
              点重置
            </p>
            <p>{`您今日已使用存储 ${userDailyStorageMB} MB`}</p>
            <Progress size="sm" value={progress()} aria-label="已使用存储" />
          </div>
          <div>
            <p>上传配额</p>
            <ul>
              <li>1. 普通用户每天拥有 100MB 的补丁资源上传额度</li>
              <li>2. 创作者每天拥有 5GB 的补丁资源上传额度</li>
            </ul>
            <p>
              您需要发布 3 个符合规定的 Galgame 补丁以{' '}
              <Link href="/apply" size="sm">
                申请成为创作者
              </Link>
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <form className="space-y-6">
          <ResourceTypeSelect control={control} errors={errors} />

          {watch().storage !== 'user' && (
            <FileUploadContainer
              onSuccess={handleUploadSuccess}
              handleRemoveFile={handleRemoveFile}
            />
          )}

          {(watch().storage === 'user' || watch().content) && (
            <ResourceLinksInput
              errors={errors}
              storage={watch().storage}
              content={watch().content}
              setContent={(content) => setValue('content', content)}
            />
          )}

          <ResourceDetailsForm control={control} errors={errors} />

          <div className="space-y-2">
            <h3 className="text-lg font-medium">资源备注</h3>
            <div className="text-sm font-medium text-default-500">
              我们建议您详细的说明如何使用您发布的补丁, 例如
              <ul>
                <li>
                  - 注意事项 / 使用说明 (闪退说明, 不兼容 xxx, 需要安装 xxx)
                </li>
                <li> - 原创 / 授权说明 (补丁的作者, 以及是否为原创或是转载)</li>
                <li>
                  - 更新日志 (网站只会通知用户该补丁被作者更新,
                  更新的对于补丁的具体影响可以列举说明)
                </li>
              </ul>
            </div>
            <MilkdownProvider>
              <KunEditor
                valueMarkdown={watch().note}
                saveMarkdown={(markdown) => setValue('note', markdown)}
              />
            </MilkdownProvider>
          </div>
        </form>
      </ModalBody>

      <ModalFooter className="flex-col items-end">
        <div className="space-x-2">
          <Button color="danger" variant="light" onPress={onClose}>
            取消
          </Button>
          <Button
            color="primary"
            disabled={creating}
            isLoading={creating}
            endContent={<Upload className="size-4" />}
            onPress={handleRewriteResource}
          >
            发布资源
          </Button>
        </div>

        {creating && (
          <>
            <p>
              我们正在将您的补丁从服务器同步到云端, 请稍后 ...
              取决于您的网络环境, 这也许需要一段时间
            </p>
          </>
        )}
      </ModalFooter>
    </ModalContent>
  )
}
