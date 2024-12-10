'use client'

import { Button, Slider } from '@nextui-org/react'
import { InspectionPanel, RotateCw } from 'lucide-react'
import type { KunAspect } from './types'

interface CropControlsProps {
  scale: number
  rotate: number
  aspect: KunAspect
  onScaleChange: (value: number) => void
  onRotateChange: (value: number) => void
  onAspectToggle: () => void
}

export const KunCropControls = ({
  scale,
  rotate,
  aspect,
  onScaleChange,
  onRotateChange,
  onAspectToggle
}: CropControlsProps) => {
  return (
    <div className="flex flex-col w-full max-w-md gap-4 p-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-default-700">缩放比例</label>
        <Slider
          size="sm"
          step={0.1}
          maxValue={3}
          minValue={0.5}
          value={scale}
          onChange={(value) => onScaleChange(Number(value))}
          className="max-w-md"
          label="图片缩放比例"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-default-700">旋转角度</label>
        <Slider
          size="sm"
          step={1}
          maxValue={180}
          minValue={-180}
          value={rotate}
          onChange={(value) => onRotateChange(Number(value))}
          className="max-w-md"
          label="图片旋转角度"
        />
      </div>

      <Button
        color="secondary"
        variant="flat"
        isDisabled={!!aspect}
        startContent={
          aspect ? (
            <InspectionPanel className="w-4 h-4" />
          ) : (
            <RotateCw className="w-4 h-4" />
          )
        }
        onClick={onAspectToggle}
      >
        {aspect ? `比例: ${aspect.x} / ${aspect.y}` : '自由尺寸'}
      </Button>
    </div>
  )
}
