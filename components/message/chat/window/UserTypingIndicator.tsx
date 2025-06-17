export const UserTypingIndicator = ({
  users
}: {
  users: Record<number, KunUser>
}) => {
  const userList = Object.values(users)

  if (userList.length === 0) {
    return null
  }

  let text = ''
  if (userList.length === 1) {
    text = `${userList[0].name} 正在输入...`
  } else if (userList.length === 2) {
    text = `${userList[0].name} 和 ${userList[1].name} 正在输入...`
  } else {
    text = `${userList.length} 等正在输入...`
  }

  return (
    <div className="text-xs text-gray-500 italic animate-pulse">{text}</div>
  )
}
