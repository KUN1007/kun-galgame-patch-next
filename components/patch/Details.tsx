'use client'

import {
  Chip,
  Divider,
  Button,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab
} from '@nextui-org/react'
import { Calendar, Clock, Link } from 'lucide-react'
import { PatchResources } from './Resource'
import { PatchComments } from './Comments'
import { PatchHistory } from './History'
import type { Patch } from '~/types/api/patch'

interface PatchDetailsProps {
  patch: Patch
}

export function PatchDetails({ patch }: PatchDetailsProps) {
  // Mock data for demonstration
  const mockResources = [
    {
      id: 1,
      size: '2.3 GB',
      type: ['汉化补丁', 'v1.02'],
      language: ['简体中文'],
      note: '莲最可爱莲最可爱',
      link: ['https://www.kungal.com/zh-cn/galgame/1'],
      password: '',
      platform: ['Windows'],
      like: [],
      time: 0,
      status: 1,
      user_id: 1,
      patch_id: 1,
      created: new Date(),
      updated: new Date(),
      code: ''
    }
  ]

  const mockComments = [
    {
      pcid: 1,
      pid: 1,
      content: '莲最可爱莲最可爱',
      likes: [1, 2, 3],
      parent_id: null,
      user_id: 1,
      patch_id: 1,
      created: new Date(),
      updated: new Date(),
      user: {
        name: '鲲',
        avatar: ''
      }
    }
  ]

  const mockHistory = [
    {
      phid: 1,
      action: '更新汉化补丁',
      type: '补丁',
      content: '莲最可爱莲最可爱',
      user_id: 1,
      patch_id: 1,
      created: new Date(),
      updated: new Date(),
      user: {
        name: 'kun'
      }
    }
  ]

  return (
    <Tabs className="w-full" color="primary" fullWidth={true}>
      <Tab key="introduction" title="游戏介绍">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">游戏介绍</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              {patch.introduction || 'No introduction available.'}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>
                  创建时间: {new Date(patch.created).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>
                  更新时间: {new Date(patch.updated).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link className="w-4 h-4" />
                <span>VNDB ID: {patch.vndb_id}</span>
              </div>
            </div>

            {patch.alias.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-4 text-xl font-medium">游戏别名</h3>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  {patch.alias.map((alias) => (
                    <li key={alias}>{alias}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </Tab>
      <Tab key="resources" title="资源链接">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">资源链接</h2>
          </CardHeader>
          <CardBody>
            <PatchResources resources={mockResources} />
          </CardBody>
        </Card>
      </Tab>

      <Tab key="comments" title="游戏评论">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">游戏评论</h2>
          </CardHeader>
          <CardBody>
            <PatchComments comments={mockComments} />
          </CardBody>
        </Card>
      </Tab>

      <Tab key="history" title="贡献历史">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">贡献历史</h2>
          </CardHeader>
          <CardBody>
            <PatchHistory history={mockHistory} />
          </CardBody>
        </Card>
      </Tab>
    </Tabs>
  )
}
