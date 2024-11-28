'use client'

import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Switch,
  Select,
  SelectItem
} from '@nextui-org/react'

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Chinese', value: 'zh' }
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">General Settings</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Site Name"
              placeholder="Enter site name"
              defaultValue="Visual Novel Patch Database"
            />
            <Input
              label="Site Description"
              placeholder="Enter site description"
              defaultValue="A community-driven visual novel translation patch database"
            />
            <Select
              label="Default Language"
              placeholder="Select a language"
              defaultSelectedKeys={['en']}
            >
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </Select>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Security Settings</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-small text-default-500">
                  Require 2FA for admin accounts
                </p>
              </div>
              <Switch defaultSelected />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Verification</p>
                <p className="text-small text-default-500">
                  Require email verification for new accounts
                </p>
              </div>
              <Switch defaultSelected />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Maintenance</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-small text-default-500">
                  Put the site in maintenance mode
                </p>
              </div>
              <Switch />
            </div>
            <Button color="primary">Backup Database</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
