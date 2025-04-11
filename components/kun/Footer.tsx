'use client'

import Link from 'next/link'
import Image from 'next/image'

export const KunFooter = () => {
  return (
    <footer className="w-full mt-8 text-sm border-t border-divider">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="flex flex-wrap justify-center gap-4 py-6 md:justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/favicon.webp"
              alt="鲲 Galgame 补丁"
              width={30}
              height={30}
            />
            <span>© 2024 鲲 Galgame 补丁</span>
          </Link>

          <div className="flex space-x-8">
            <Link href="/about" className="flex items-center">
              使用指南
            </Link>
            <Link
              href="https://nav.kungal.org"
              target="_blank"
              className="flex items-center"
            >
              网站集群
            </Link>

            <Link href="/friend-link" className="flex items-center">
              友情链接
            </Link>

            <Link
              href="https://github.com/KUN1007/kun-galgame-patch-next"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              GitHub 仓库
            </Link>
          </div>

          <div className="flex space-x-8">
            <span className="flex items-center">联系我们</span>
            <Link
              href="https://t.me/kungalgame"
              className="flex items-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram
            </Link>
            <Link href="https://www.kungal.com" className="flex items-center">
              主站论坛
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
