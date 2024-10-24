import toast from 'react-hot-toast'

export const useErrorHandler = <T>(
  res: T | string,
  callback: (res: T) => void
) => {
  if (typeof res === 'string') {
    toast.error(res)
  } else {
    callback(res)
  }
}
