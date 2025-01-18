import toast from 'react-hot-toast'

export const kunErrorHandler = <T>(
  res: T | string,
  callback: (res: T) => void
) => {
  if (typeof res === 'string') {
    toast.error(res)
  } else {
    callback(res)
  }
}

export const kunErrorHandlerAsync = <T>(res: T | string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    if (typeof res === 'string') {
      toast.error(res)
      reject(new Error(res))
    } else {
      resolve(res)
    }
  })
}

export const errorReporter = (error: unknown) => {
  if (error instanceof Error) {
    toast.error(error.message)
  } else {
    toast.error('发生未知错误')
  }
}
