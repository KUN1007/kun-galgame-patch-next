import friendsData from './friend.json'

interface KunFriend {
  name: string
  avatar: string
  label: string
  link: string
}

export const kunFriends: KunFriend[] = friendsData.friends
