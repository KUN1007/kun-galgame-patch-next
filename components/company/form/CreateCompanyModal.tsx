'use client'

import { type FC, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Company } from '~/types/api/company'
import { createCompanySchema } from '~/validations/company'
import toast from 'react-hot-toast'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Textarea,
  ModalFooter,
  Select,
  SelectItem
} from '@nextui-org/react'
import { ArrayAdder } from './ArrayAdder'
import { SUPPORTED_LANGUAGE_MAP } from '~/constants/resource'

type FormData = z.infer<typeof createCompanySchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (company: Company) => void
}

const languages = Object.entries(SUPPORTED_LANGUAGE_MAP).map(
  ([key, value]) => ({ key, value })
)

export const CreateCompanyModal: FC<Props> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [aliasInput, setAliasInput] = useState('')
  const [websiteInput, setWebsiteInput] = useState('')
  const [brandInput, setBrandInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    formState: { errors },
    getValues,
    watch,
    setValue,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      introduction: '',
      alias: [],
      primary_language: [],
      official_website: [],
      parent_brand: []
    }
  })

  const addAlias = () => {
    const lowerCompany = aliasInput.trim().toLowerCase()
    if (!lowerCompany) {
      return
    }

    const prevAlias = getValues().alias
    if (!prevAlias?.includes(lowerCompany)) {
      setValue('alias', [...prevAlias, lowerCompany])
      setAliasInput('')
    } else {
      toast.error('该会社别名已存在，请更换')
    }
  }

  const handleRemoveAlias = (index: number) => {
    const prevAlias = getValues().alias
    setValue(
      'alias',
      prevAlias?.filter((_, i) => i !== index)
    )
  }

  const addWebsite = () => {
    const trimmedWebsite = websiteInput.trim()
    if (!trimmedWebsite) {
      return
    }

    const prevWebsite = getValues().official_website
    if (!prevWebsite?.includes(trimmedWebsite)) {
      setValue('official_website', [...prevWebsite, trimmedWebsite])
      setWebsiteInput('')
    } else {
      toast.error('该站点地址已存在，请更换')
    }
  }

  const handleRemoveWebsite = (index: number) => {
    const prevWebsite = getValues().official_website
    setValue(
      'official_website',
      prevWebsite?.filter((_, i) => i !== index)
    )
  }

  const addParentBrand = () => {
    const lowerBrand = brandInput.trim().toLowerCase()
    if (!lowerBrand) {
      return
    }

    const prevBrand = getValues().parent_brand
    if (!prevBrand?.includes(lowerBrand)) {
      setValue('parent_brand', [...prevBrand, lowerBrand])
      setBrandInput('')
    } else {
      toast.error('该母公司已存在，请更换')
    }
  }

  const handleRemoveParentBrand = (index: number) => {
    const prevBrand = getValues().parent_brand
    setValue(
      'parent_brand',
      prevBrand?.filter((_, i) => i !== index)
    )
  }

  const handleCreateCompany = async () => {
    if (!watch().alias) {
      return
    }
    addAlias()

    setIsSubmitting(true)
    // 模拟请求
    async function mock(): Promise<Omit<Company, 'id' | 'count'>> {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(watch())
        }, 1000)
      })
    }
    const res = await mock()
    console.log(res)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
        <form>
          <ModalHeader>创建新会社</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <Input
                {...register('name')}
                label="会社名"
                placeholder="输入会社名"
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
              />

              <Textarea
                {...register('introduction')}
                label="会社简介"
                placeholder="输入会社简介"
                isInvalid={!!errors.introduction}
                errorMessage={errors.introduction?.message}
              />

              <ArrayAdder
                label="别名"
                placeholder="可以按回车添加别名"
                input={aliasInput}
                setInput={setAliasInput}
                addItem={addAlias}
                removeItem={handleRemoveAlias}
                watchDataSource={watch().alias}
              />

              <ArrayAdder
                label="官网站点"
                placeholder="可以按回车添加官网站点"
                input={websiteInput}
                setInput={setWebsiteInput}
                addItem={addWebsite}
                removeItem={handleRemoveWebsite}
                watchDataSource={watch().official_website}
              />

              <ArrayAdder
                label="母公司"
                placeholder="可以按回车添加母公司"
                input={brandInput}
                setInput={setBrandInput}
                addItem={addParentBrand}
                removeItem={handleRemoveParentBrand}
                watchDataSource={watch().parent_brand}
              />

              <Select
                {...register('primary_language')}
                label="主要语言"
                placeholder="请选择主要语言"
                selectionMode="multiple"
              >
                {languages.map((language) => (
                  <SelectItem key={language.key}>{language.value}</SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleClose}>
              取消
            </Button>
            <Button
              color="primary"
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              onPress={handleCreateCompany}
            >
              创建
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
