import { SUPPORTED_RESOURCE_LINK } from '~/constants/resource'

export interface UploadFileResponse {
  filetype: (typeof SUPPORTED_RESOURCE_LINK)[number]
  fileHash: string
  fileSize: string
}

export interface KunChunkMetadata {
  chunkIndex: number
  totalChunks: number
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string
  filepath: string
  fileHash: string
}
