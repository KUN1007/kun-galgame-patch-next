'use client'

import { type FC, useState } from 'react'
import { Chip } from '@nextui-org/chip'
import { Tooltip } from '@nextui-org/tooltip'
import { Link } from '@nextui-org/link'
import { Company } from '~/types/api/company'
import { PatchCompanySelector } from './PatchCompanySelector'

interface Props {
  patchId: number
  initialCompanies: Company[]
}

export const PatchCompany: FC<Props> = ({ patchId, initialCompanies }) => {
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>(
    initialCompanies ?? []
  )

  return (
    <div className="mt-4 space-y-4">
      <h2 className="text-xl font-medium">所属会社</h2>

      <div className="space-x-2">
        {selectedCompanies.map((company) => (
          <Tooltip
            key={company.id}
            content={`${company.count} 个补丁本体属于此会社`}
          >
            <Link href={`/company/${company.id}`}>
              <Chip color="secondary" variant="flat">
                {company.name}
                {` +${company.count}`}
              </Chip>
            </Link>
          </Tooltip>
        ))}

        {!initialCompanies.length && (
          <Chip>{'这个补丁本体暂未添加所属会社信息'}</Chip>
        )}
      </div>

      <PatchCompanySelector
        patchId={patchId}
        initialCompanies={selectedCompanies}
        onCompanyChange={setSelectedCompanies}
      />
    </div>
  )
}
