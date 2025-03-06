import { Slider } from '@nextui-org/react'
import { FC } from 'react'

interface KunMosaicControllerProps {
  mosaicSize: number
  onMosaicSizeChange: (size: number) => void
}

export const KunMosaicController: FC<KunMosaicControllerProps> = ({
  mosaicSize,
  onMosaicSizeChange
}) => {
  return (
    <div className="flex flex-col w-full max-w-md gap-4 p-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-default-700">马赛克尺寸</label>
        <Slider
          size="sm"
          step={1}
          maxValue={48}
          minValue={16}
          value={mosaicSize}
          onChange={(value) => onMosaicSizeChange(Number(value))}
          className="max-w-md"
          label="单位：像素"
        />
      </div>
    </div>
  )
}
