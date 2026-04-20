'use client'

import { Button } from '@heroui/react'
import { Clock, X } from 'lucide-react'
import { useSearchStore } from '~/store/searchStore'
import type { Dispatch, SetStateAction } from 'react'

interface Props {
  showHistory: boolean
  setShowHistory: Dispatch<SetStateAction<boolean>>
  setQuery: Dispatch<SetStateAction<string>>
}

export const SearchHistory = ({
  showHistory,
  setShowHistory,
  setQuery
}: Props) => {
  const searchData = useSearchStore((state) => state.data)
  const setSearchData = useSearchStore((state) => state.setData)

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem)
    setShowHistory(false)
  }

  return (
    <>
      {showHistory && searchData.searchHistory.length > 0 && (
        <div className="absolute z-50 w-full mt-1 border shadow-lg rounded-2xl bg-content1 border-default-200">
          <div className="flex items-center justify-between p-2 border-b border-default-200">
            <span className="flex items-center gap-1 text-sm text-default-500">
              <Clock size={16} /> 搜索历史
            </span>
            <Button
              size="sm"
              variant="light"
              color="danger"
              startContent={<X size={16} />}
              onPress={() =>
                setSearchData({ ...searchData, searchHistory: [] })
              }
            >
              清除全部历史
            </Button>
          </div>

          <div className="overflow-y-auto max-h-60">
            {searchData.searchHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-default-100 rounded-2xl"
                onClick={() => handleHistoryClick(item)}
              >
                <Clock size={16} className="text-default-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
