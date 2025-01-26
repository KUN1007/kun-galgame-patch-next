import toast from 'react-hot-toast'
import { kunFetchFormData } from '~/utils/kunFetch'
import { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } from '~/constants/resource'
import type { KunChunkMetadata } from '~/types/api/upload'

const validateFileType = (file: File): boolean => {
  const fileExtension = file.name
    .slice(file.name.lastIndexOf('.'))
    .toLowerCase()
  return (
    ALLOWED_MIME_TYPES.includes(file.type) ||
    ALLOWED_EXTENSIONS.includes(fileExtension)
  )
}

export const handleFileInput = (file: File | undefined, role: number) => {
  if (!file) {
    toast.error('未选择文件')
    return
  }

  if (!validateFileType(file)) {
    toast.error('文件类型不被支持，仅接受 .zip, .rar, .7z 格式')
    return
  }

  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB < 0.001) {
    toast.error('文件过小, 您的文件小于 0.001 MB')
    return
  }
  if (role === 1 && fileSizeMB > 100) {
    toast.error(
      `文件大小超出限制: ${fileSizeMB.toFixed(3)} MB, 普通用户上传最大允许大小为 100 MB`
    )
    return
  }
  if (role >= 2 && fileSizeMB > 1024) {
    toast.error(
      `文件大小超出限制: ${fileSizeMB.toFixed(3)} MB, 创作者或管理员上传最大允许大小为 1GB`
    )
    return
  }
  return file
}

export const uploadChunk = async (
  file: File,
  chunk: Blob,
  chunkIndex: number,
  fileId: string,
  totalChunks: number
): Promise<KunChunkMetadata | string> => {
  const formData = new FormData()
  formData.append('chunk', chunk)
  formData.append(
    'metadata',
    JSON.stringify({
      chunkIndex,
      totalChunks,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      filepath: '',
      fileHash: ''
    } as KunChunkMetadata)
  )

  const response = await kunFetchFormData<KunResponse<KunChunkMetadata>>(
    '/upload/resource',
    formData
  )
  if (typeof response === 'string') {
    toast.error(response)
    return response
  }
  return response
}
