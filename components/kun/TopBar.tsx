'use client'

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button
} from '@nextui-org/react'

export const KunTopBar = () => {
  return (
    <Navbar>
      <NavbarBrand>
        <img src="/favicon.webp" alt="鲲 Galgame 补丁" width={50} height={50} />
        <p className="ml-2 font-bold text-inherit">ACME</p>
      </NavbarBrand>
      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        <NavbarItem>
          <Link color="foreground" href="#">
            补丁下载
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link href="/edit" aria-current="page">
            发布补丁
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="#">
            关于我们
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="hidden lg:flex">
          <Link href="/login">登录</Link>
        </NavbarItem>
        <NavbarItem>
          <Button as={Link} color="primary" href="/register" variant="flat">
            注册
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}
