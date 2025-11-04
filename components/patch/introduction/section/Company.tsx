'use client'

import { Building2 } from 'lucide-react'
import { Card, CardBody } from '@heroui/card'
import { Image } from '@heroui/react'
import type { PatchDetail } from '~/types/api/patch'

export const CompanySection = ({ detail }: { detail: PatchDetail }) => (
  <>
    {detail.company.length > 0 && (
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-primary rounded" />
          <h2 className="text-2xl font-bold">厂商</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {detail.company.map((c) => (
            <Card key={c.id} className="shadow-sm">
              <CardBody className="flex items-center gap-3 p-4">
                <div className="w-14 h-14 rounded bg-default-100 overflow-hidden flex items-center justify-center">
                  {c.logo ? (
                    <Image src={c.logo} alt={c.name} radius="none" />
                  ) : (
                    <Building2 className="w-6 h-6 text-default-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    <a href={`/company/${c.id}`} className="hover:underline">
                      {c.name}
                    </a>
                  </h3>
                  <div className="text-xs text-default-500">
                    共 {c.count} 个补丁
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    )}
  </>
)
