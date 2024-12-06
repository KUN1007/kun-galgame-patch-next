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
