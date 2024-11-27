import { SUPPORTED_RESOURCE_LINK } from '~/constants/resource'

export interface UploadFileResponse {
  filetype: (typeof SUPPORTED_RESOURCE_LINK)[number]
  fileHash: string
  fileSize: string
}
