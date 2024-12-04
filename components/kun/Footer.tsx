'use client'

import { Link } from '@nextui-org/react'

export const KunFooter = () => {
  return (
    <footer className="py-8 text-sm border-t border-divider">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="flex flex-wrap justify-between gap-8">
          <div className="flex gap-8">
            <Link href="#" color="foreground">
              © 2024 Kun Visual Novel Patch
            </Link>
            <Link href="#" color="foreground">
              Terms
            </Link>
            <Link href="#" color="foreground">
              Privacy
            </Link>
            <Link href="#" color="foreground">
              Security
            </Link>
            <Link href="#" color="foreground">
              Status
            </Link>
            <Link href="#" color="foreground">
              Docs
            </Link>
          </div>
          <div className="flex gap-8">
            <Link href="#" color="foreground">
              Contact
            </Link>
            <Link href="#" color="foreground">
              Discord
            </Link>
            <Link href="#" color="foreground">
              Twitter
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
