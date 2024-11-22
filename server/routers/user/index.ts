import { router } from '~/lib/trpc'
import { getProfile, logout, checkIn, status } from './status'
import {
  updateUserAvatar,
  updateUsername,
  updateBio,
  sendResetEmailVerificationCode,
  updateEmail,
  updatePassword
} from './settings'
import {
  getUserPatchResource,
  getUserGalgame,
  getUserContribute,
  getUserComment,
  getUserFavorite
} from './profile'
import {
  getUserFollower,
  getUserFollowing,
  followUser,
  unfollowUser
} from './follow'

export const userRouter = router({
  getProfile,
  logout,
  checkIn,
  status,

  updateUserAvatar,
  updateUsername,
  updateBio,
  sendResetEmailVerificationCode,
  updateEmail,
  updatePassword,

  getUserPatchResource,
  getUserGalgame,
  getUserContribute,
  getUserComment,
  getUserFavorite,

  getUserFollower,
  getUserFollowing,
  followUser,
  unfollowUser
})
