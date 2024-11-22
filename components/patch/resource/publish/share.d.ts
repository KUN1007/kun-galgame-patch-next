import type { Control, FieldErrors } from 'react-hook-form'

interface Fields {
  patchId: number
  code: string
  type: string[]
  link: string[]
  size: string
  password: string
  note: string
  language: string[]
  platform: string[]
}

export type ErrorType = FieldErrors<Fields>
export type ControlType = Control<Fields, any>
