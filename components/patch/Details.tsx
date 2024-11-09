import DOMPurify from 'isomorphic-dompurify'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/Tabs'
import { Calendar, Clock, Link } from 'lucide-react'
import { Resources } from './Resource'
import { Comments } from './Comments'
import { History } from './History'
import type { Patch } from '~/types/api/patch'

export const PatchDetails = ({ patch }: { patch: Patch }) => {
  return (
    <Tabs className="w-full" defaultValue="introduction">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="introduction">游戏介绍</TabsTrigger>
        <TabsTrigger value="resources">资源链接</TabsTrigger>
        <TabsTrigger value="comments">游戏评论</TabsTrigger>
        <TabsTrigger value="history">贡献历史</TabsTrigger>
      </TabsList>

      <TabsContent value="introduction">
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
      </TabsContent>

      <TabsContent value="resources">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">资源链接</h2>
          </CardHeader>
          <CardBody>
            <Resources id={patch.id} />
          </CardBody>
        </Card>
      </TabsContent>

      <TabsContent value="comments">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">游戏评论</h2>
          </CardHeader>
          <CardBody>
            <Comments id={patch.id} />
          </CardBody>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-medium">贡献历史</h2>
          </CardHeader>
          <CardBody>
            <History id={patch.id} />
          </CardBody>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
