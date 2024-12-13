export const isValidTimestamp = (timestamp: number) => {
  return (
    timestamp.toString().length === 10 || timestamp.toString().length === 13
  )
}

export const isValidURL = (url: string) => {
  try {
    const _ = new URL(url)
    return true
  } catch (_) {
    return false
  }
}

export const kunEmailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,24}$/
export const isValidEmail = (email: string) => {
  return kunEmailRegex.test(email)
}

export const kunUsernameRegex = /^[\p{L}\p{N}!~_@#$%^&*()+=-]{1,17}$/u
export const isValidName = (name: string) => {
  return kunUsernameRegex.test(name)
}

export const kunPasswordRegex =
  /^(?=.*[a-zA-Z])(?=.*[0-9])[\w!@#$%^&*()+=\\/-]{6,1007}$/
export const isValidPassword = (pwd: string) => {
  return kunPasswordRegex.test(pwd)
}

export const kunValidMailConfirmCodeRegex = /^[a-zA-Z0-9]{7}$/
export const isValidMailConfirmCode = (code: string) => {
  return kunValidMailConfirmCodeRegex.test(code)
}

export const ResourceSizeRegex: RegExp = /^.{0,107}(mb|gb)$/i

export const VNDBRegex: RegExp = /^v\d{1,6}$/
