import type { Control, FieldErrors } from 'react-hook-form'
import type { PatchResourceLink } from '~/types/api/patch'

interface Fields {
  type: string[]
  name: string
  modelName: string
  patchId: number
  code: string
  storage: string
  hash: string
  content: string
  size: string
  password: string
  note: string
  language: string[]
  platform: string[]
}

// uploadStatus: 1 - uploading, 2 - merging, 3 - complete, 4 - error
export interface FileStatus {
  file: File
  progress: number
  uploadStatus: number
  error?: string
  hash?: string
  filetype?: string
}

export type ErrorType = FieldErrors<Fields>
export type ControlType = Control<Fields, any>
