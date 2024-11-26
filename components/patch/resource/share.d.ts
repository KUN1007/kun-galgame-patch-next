import type { Control, FieldErrors } from 'react-hook-form'
import type { PatchResourceLink } from '~/types/api/patch'

interface Fields {
  type: string[]
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

export interface FileStatus {
  file: File
  progress: number
  error?: string
  hash?: string
  filetype?: string
}

export type ErrorType = FieldErrors<Fields>
export type ControlType = Control<Fields, any>
