import { Button, Progress, Card } from '@nextui-org/react'
import { File as FileIcon } from 'lucide-react'
import type { FileStatus } from '../share'

interface Props {
  fileData: FileStatus
  onRemove: () => void
}

const calcFileSizeMB = (byteNumber: number) => {
  const fileSizeInMB = byteNumber / (1024 * 1024)
  return `${fileSizeInMB.toFixed(3)} MB`
}

export const FileUploadCard = ({ fileData, onRemove }: Props) => {
  return (
    <Card className="p-4 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileIcon className="w-6 h-6 text-primary/60" />
          <div className="flex-1">
            <p className="font-medium truncate">
              {fileData.file.name.slice(0, 20)}
            </p>
            <p className="text-sm text-default-500">
              {calcFileSizeMB(fileData.file.size)}
            </p>
          </div>
        </div>
        {fileData.hash ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-default-500">文件上传成功</span>
            <Button color="danger" variant="flat" onClick={onRemove}>
              移除
            </Button>
          </div>
        ) : fileData.error ? (
          <div className="flex items-center gap-2">
            <p className="text-sm text-danger-500">{fileData.error}</p>
            <Button color="danger" variant="light" onClick={onRemove}>
              移除
            </Button>
          </div>
        ) : (
          <Progress
            value={fileData.progress}
            className="w-24"
            size="sm"
            color="primary"
            aria-label={`上传进度: ${fileData.progress}%`}
          />
        )}
      </div>
    </Card>
  )
}
