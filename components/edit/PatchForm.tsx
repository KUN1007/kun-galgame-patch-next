import React, { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Chip,
  Link
} from '@nextui-org/react'
import { Upload, Plus } from 'lucide-react'
import { cn } from '~/utils/cn'
import { Editor } from '~/components/edit/MilkdownEditor'

interface PatchFormData {
  banner: File | null
  name: string
  vndb_id: string
  introduction: string
  alias: string[]
}

export const PatchSubmissionForm = () => {
  const [formData, setFormData] = useState<PatchFormData>({
    banner: null,
    name: '',
    vndb_id: '',
    introduction: '',
    alias: []
  })
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [newAlias, setNewAlias] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, banner: file })
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setFormData({ ...formData, banner: file })
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const addAlias = () => {
    if (newAlias.trim() && !formData.alias.includes(newAlias.trim())) {
      setFormData({
        ...formData,
        alias: [...formData.alias, newAlias.trim()]
      })
      setNewAlias('')
    }
  }

  const removeAlias = (index: number) => {
    setFormData({
      ...formData,
      alias: formData.alias.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formDataToSend = new FormData()
    if (formData.banner) {
      formDataToSend.append('banner', formData.banner)
    }
    formDataToSend.append('name', formData.name)
    formDataToSend.append('vndb_id', formData.vndb_id)
    formDataToSend.append('introduction', formData.introduction)
    formDataToSend.append('alias', JSON.stringify(formData.alias))

    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/submit-patch', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        alert('补丁信息提交成功！')
        // Reset form
        setFormData({
          banner: null,
          name: '',
          vndb_id: '',
          introduction: '',
          alias: []
        })
        setPreviewUrl('')
      } else {
        throw new Error('提交失败')
      }
    } catch (error) {
      alert('提交失败，请重试')
      console.error('Error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 w-full p-4 mx-auto">
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-2xl">创建新游戏</p>
            <p className="text-small text-default-500">
              您需要创建一个新游戏, 稍后在游戏页面添加补丁资源
            </p>
          </div>
        </CardHeader>
        <CardBody className="gap-4 mt-2">
          <p className="text-sm font-bold">预览图片</p>
          {/* Banner Upload */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-4 text-center transition-colors  mb-4',
              isDragging ? 'border-primary bg-primary/10' : 'border-gray-300',
              previewUrl ? 'h-[300px]' : 'h-[200px]'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {previewUrl ? (
              <div className="relative h-full">
                <img
                  src={previewUrl}
                  alt="Banner preview"
                  className="object-contain w-full h-full"
                />
                <Button
                  color="danger"
                  variant="flat"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPreviewUrl('')
                    setFormData({ ...formData, banner: null })
                  }}
                >
                  移除
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Upload className="w-12 h-12 mb-4 text-gray-400" />
                <p className="mb-2">拖放图片到此处或</p>
                <label>
                  <Button color="primary" variant="flat" as="span">
                    选择文件
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleBannerChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Name Input */}
          <Input
            isRequired
            variant="underlined"
            labelPlacement="outside"
            label="游戏名称"
            placeholder="输入游戏名称, 这会作为游戏的标题"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="mb-4"
          />

          {/* VNDB ID Input */}
          <div className="flex flex-col w-full gap-2 mb-4">
            <Input
              isRequired
              variant="underlined"
              labelPlacement="outside"
              label="VNDB ID"
              placeholder="请输入 VNDB ID, 例如 v19658"
              value={formData.vndb_id}
              onChange={(e) =>
                setFormData({ ...formData, vndb_id: e.target.value })
              }
              required
            />
            <p className="text-sm ">
              VNDB ID 需要 VNDB 官网 (vndb.org)
              获取，当进入对应游戏的页面，游戏页面的 URL (形如
              https://vndb.org/v19658) 中的 v19658 就是 VNDB ID
            </p>
            <div className="flex items-center text-sm">
              <p>VNDB 官网为</p>
              <Link
                href="http://vndb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2"
              >
                vndb.org
              </Link>
            </div>
          </div>

          {/* Introduction Textarea */}
          <p className="text-sm font-bold">游戏介绍</p>
          <Editor />

          {/* Alias Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                labelPlacement="outside"
                label="别名"
                placeholder="输入后点击加号添加, 建议填写游戏的日语原名以便搜索"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                className="flex-1"
              />
              <Button
                color="primary"
                onClick={addAlias}
                className="self-end"
                isIconOnly
              >
                <Plus size={20} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.alias.map((alias, index) => (
                <Chip
                  key={index}
                  onClose={() => removeAlias(index)}
                  variant="flat"
                  className="h-8"
                >
                  {alias}
                </Chip>
              ))}
            </div>
          </div>

          <Button color="primary" type="submit" className="w-full mt-4">
            提交
          </Button>
        </CardBody>
      </Card>
    </form>
  )
}
