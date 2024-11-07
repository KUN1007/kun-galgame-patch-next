'use client'

import { Tab, Tabs } from '@nextui-org/tabs'

export const UserActivity = () => {
  return (
    <Tabs aria-label="User activity" variant="underlined" fullWidth>
      <Tab key="patches" title="补丁">
        <div className="p-4">
          <p className="text-default-500">补丁</p>
        </div>
      </Tab>
      <Tab key="resources" title="资源">
        <div className="p-4">
          <p className="text-default-500">资源</p>
        </div>
      </Tab>
      <Tab key="contributions" title="贡献">
        <div className="p-4">
          <p className="text-default-500">贡献</p>
        </div>
      </Tab>
      <Tab key="comments" title="评论">
        <div className="p-4">
          <p className="text-default-500">评论</p>
        </div>
      </Tab>
      <Tab key="favorite" title="收藏">
        <div className="p-4">
          <p className="text-default-500">收藏</p>
        </div>
      </Tab>
    </Tabs>
  )
}
