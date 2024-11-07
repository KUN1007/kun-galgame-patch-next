'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Textarea,
  Avatar
} from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { useUserStore } from '~/store/userStore'

const mockUser = {
  id: 1,
  name: '鲲',
  email: 'kun@moyu.moe',
  avatar: '	https://image.kungal.com/avatar/user_2/avatar.webp',
  bio: '🚀 Full-stack developer'
}

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    newPassword: '',
    bio: '',
    avatar: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        newPassword: '',
        bio: user.bio,
        avatar: user.avatar
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatar: reader.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-2xl m-auto">
      <Card className="w-full">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-default-500">
            Manage your account settings and profile information
          </p>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar
                  src={formData.avatar}
                  className="w-24 h-24"
                  isBordered
                  color="primary"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 cursor-pointer bg-black/50 group-hover:opacity-100"
                >
                  <Camera className="w-6 h-6 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-small text-default-500">
                Click to upload new avatar
              </p>
            </div>

            {/* Name */}
            <Input
              label="Display Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />

            {/* Email */}
            <Input
              type="email"
              label="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />

            {/* Current Password */}
            <Input
              type="password"
              label="Current Password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Enter current password to make changes"
              required
            />

            {/* New Password */}
            <Input
              type="password"
              label="New Password (Optional)"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  newPassword: e.target.value
                }))
              }
              placeholder="Leave blank to keep current password"
            />

            {/* Bio */}
            <Textarea
              label="Bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Tell us about yourself"
              maxRows={4}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                color="danger"
                variant="light"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
