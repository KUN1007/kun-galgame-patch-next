import type { FC } from 'react'
import { Plus } from 'lucide-react'
import { Chip, Button, Input } from '@nextui-org/react'

interface ArrayAdderProps {
  label: string
  placeholder: string
  input: string
  setInput: (value: string) => void
  addItem: () => void
  removeItem: (index: number) => void
  watchDataSource: string[]
}

export const ArrayAdder: FC<ArrayAdderProps> = ({
  label,
  placeholder,
  input,
  setInput,
  addItem,
  removeItem,
  watchDataSource
}) => {
  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <Input
          labelPlacement="outside"
          label={label}
          placeholder={placeholder}
          value={input}
          onChange={(e) => {
            e.preventDefault()
            setInput(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem()
            }
          }}
        />
        <Button
          color="primary"
          onPress={addItem}
          className="self-end"
          isIconOnly
        >
          <Plus size={20} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {watchDataSource.map((item, index) => (
          <Chip key={index} onClose={() => removeItem(index)} variant="flat">
            {item}
          </Chip>
        ))}
      </div>
    </div>
  )
}
