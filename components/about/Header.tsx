// import { Input } from '@heroui/react'
// import { Search } from 'lucide-react'
import { KunHeader } from '../kun/Header'

// interface HeaderProps {
//   onSearch: (value: string) => void
// }

export const KunAboutHeader = () => {
  return (
    <div className="mb-8 space-y-6">
      <KunHeader name="关于我们" description="开源 Galgame 补丁资源下载站" />

      {/* <Input
        classNames={{
          input: 'text-small',
          inputWrapper: 'h-12'
        }}
        placeholder="Search articles..."
        startContent={<Search size={18} />}
        onChange={(e) => onSearch(e.target.value)}
      /> */}
    </div>
  )
}
