'use client'

import DOMPurify from 'isomorphic-dompurify'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Tabs, Tab } from '@nextui-org/tabs'
import { Link as NextLink } from '@nextui-org/link'
import { Calendar, Clock, Link } from 'lucide-react'
import { Resources } from './resource/Resource'
import { Comments } from './comment/Comments'
import { History } from './History'
import type { Patch } from '~/types/api/patch'

export const TabNav = ({ patch }: { patch: Patch }) => {
  return (
    <Tabs
      className="w-full my-6 overflow-hidden shadow-medium rounded-large"
      fullWidth={true}
    >
      <Tab key="introduction" title="游戏介绍" className="p-0">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">游戏介绍</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(patch.introduction)
              }}
              className="prose max-w-none dark:prose-invert"
            />

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
                <span>VNDB ID: {patch.vndbId}</span>
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
      <Tab key="resources" title="资源链接" className="p-0">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">资源链接</h2>
          </CardHeader>
          <CardBody>
            <div className="text-default-700">
              <p>
                请注意, 本站是 Galgame 补丁站, 资源链接指的是 Galgame 补丁资源,
                我们仅提供 Galgame 补丁的下载
              </p>
              如果您要下载 Galgame 本体资源, 请前往{' '}
              <NextLink showAnchorIcon href="/auth/forgot">
                主站论坛
              </NextLink>
            </div>

            <Resources id={patch.id} />
          </CardBody>
        </Card>
      </Tab>

      <Tab key="comments" title="游戏评论" className="p-0">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">游戏评论</h2>
          </CardHeader>
          <CardBody>
            <Comments id={patch.id} />
          </CardBody>
        </Card>
      </Tab>

      <Tab key="history" title="贡献历史" className="p-0">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">贡献历史</h2>
          </CardHeader>
          <CardBody>
            <History id={patch.id} />
          </CardBody>
        </Card>
      </Tab>
    </Tabs>
  )
}
