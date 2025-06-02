import {
  Button,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Input
} from "@heroui/react"
import { useState } from 'react'
import { PatchWalkthrough } from '~/types/api/patch'
import { KunEditor } from '~/components/kun/milkdown/Editor'
import { kunFetchPost } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'

interface Props {
  patchId: number
  onClose: () => void
  onSuccess?: (res: PatchWalkthrough) => void
}

export const PublishWalkthrough = ({ patchId, onClose, onSuccess }: Props) => {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')

  const [loading, setLoading] = useState(false)
  const createWalkthrough = async () => {
    setLoading(true)
    const res = await kunFetchPost<KunResponse<PatchWalkthrough>>(
      '/patch/walkthrough',
      {
        patchId,
        name: name.trim(),
        content: content.trim()
      }
    )
    kunErrorHandler(res, (value) => {
      setName('')
      setContent('')
      onSuccess?.(value)
    })
    onClose()
  }

  return (
    <ModalContent>
      <ModalHeader className="flex-col space-y-2">
        <h3 className="text-lg">创建游戏攻略</h3>
      </ModalHeader>

      <ModalBody>
        <form className="space-y-6">
          <Input
            placeholder="请填写游戏攻略的名字, 例如 (糖调全线路攻略)"
            isRequired
            value={name}
            onValueChange={setName}
          />

          <KunEditor valueMarkdown={content} saveMarkdown={setContent} />
        </form>
      </ModalBody>

      <ModalFooter className="flex-col items-end">
        <div className="space-x-2">
          <Button color="danger" variant="light" onPress={onClose}>
            取消
          </Button>
          <Button
            color="primary"
            disabled={loading}
            isLoading={loading}
            onPress={createWalkthrough}
          >
            创建攻略
          </Button>
        </div>
      </ModalFooter>
    </ModalContent>
  )
}
