'use client'

import { useState } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Button } from '@nextui-org/button'
import { Input, Textarea } from '@nextui-org/input'
import { Select, SelectItem } from '@nextui-org/select'
import { Chip } from '@nextui-org/chip'
import { Upload, Plus, X } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import toast from 'react-hot-toast'

interface CreateResourceProps {
  patchId: number
  onSuccess?: () => void
}

const SUPPORTED_TYPES = ['汉化补丁', '语音补丁', '存档', '攻略', '其他']
const SUPPORTED_LANGUAGES = ['简体中文', '繁體中文', '日本語', 'English']
const SUPPORTED_PLATFORMS = ['Windows', 'Linux', 'MacOS', 'Android', 'iOS']

export const PublishResource = ({
  patchId,
  onSuccess
}: CreateResourceProps) => {
  const [links, setLinks] = useState<string[]>([''])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  const [formData, setFormData] = useState({
    size: '',
    code: '',
    password: '',
    note: ''
  })

  const handleSubmit = async () => {
    const filteredLinks = links.filter((link) => link.trim() !== '')
    if (filteredLinks.length === 0) {
      toast.error('请提供至少一条资源链接')
      return
    }

    if (selectedTypes.length === 0) {
      toast.error('请选择至少一个资源类型')
      return
    }

    // await api.patch.createPatchResource.mutate({
    //   patchId,
    //   link: filteredLinks,
    //   type: selectedTypes,
    //   language: selectedLanguages,
    //   platform: selectedPlatforms,
    //   ...formData
    // })

    toast.success('资源发布成功')

    onSuccess?.()

    // Reset form
    setLinks([''])
    setSelectedTypes([])
    setSelectedLanguages([])
    setSelectedPlatforms([])
    setFormData({
      size: '',
      code: '',
      password: '',
      note: ''
    })
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">资源链接</h3>
          {links.map((link, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="请输入资源链接"
                value={link}
                onChange={(e) => {
                  const newLinks = [...links]
                  newLinks[index] = e.target.value
                  setLinks(newLinks)
                }}
              />
              {index === links.length - 1 ? (
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={() => setLinks([...links, ''])}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  isIconOnly
                  variant="flat"
                  color="danger"
                  onPress={() => {
                    const newLinks = links.filter((_, i) => i !== index)
                    setLinks(newLinks)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">资源详情</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="类型"
              selectionMode="multiple"
              placeholder="请选择资源的类型"
              selectedKeys={selectedTypes}
              onSelectionChange={(keys) =>
                setSelectedTypes([...keys] as string[])
              }
            >
              {SUPPORTED_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="语言"
              selectionMode="multiple"
              placeholder="请选择语言"
              selectedKeys={selectedLanguages}
              onSelectionChange={(keys) =>
                setSelectedLanguages([...keys] as string[])
              }
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="平台"
              selectionMode="multiple"
              placeholder="请选择资源的平台"
              selectedKeys={selectedPlatforms}
              onSelectionChange={(keys) =>
                setSelectedPlatforms([...keys] as string[])
              }
            >
              {SUPPORTED_PLATFORMS.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </Select>

            <Input
              label="Size"
              placeholder="e.g., 1.2GB"
              value={formData.size}
              onChange={(e) =>
                setFormData({ ...formData, size: e.target.value })
              }
            />
          </div>

          <Input
            label="提取码"
            placeholder="如果资源的获取需要密码, 请填写密码"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />

          <Input
            label="解压码"
            placeholder="如果资源的解压需要解压码, 请填写解压码"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <Textarea
            label="备注"
            placeholder="您可以在此处随意添加备注, 例如资源的注意事项等"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        <div className="flex justify-end">
          <Button
            color="primary"
            startContent={<Upload className="w-4 h-4" />}
            onPress={handleSubmit}
          >
            发布资源
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
