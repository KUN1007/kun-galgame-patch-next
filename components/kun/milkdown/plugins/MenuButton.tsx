import { Button, Tooltip } from '@nextui-org/react'
import { FC } from 'react'
import { LucideIcon } from 'lucide-react'

interface MenuButtonProps {
  tooltip: string
  icon: LucideIcon
  onClick: () => void
  ariaLabel: string
}

export const MenuButton: FC<MenuButtonProps> = ({
  tooltip,
  icon: Icon,
  onClick,
  ariaLabel
}) => (
  <Tooltip content={tooltip}>
    <Button isIconOnly variant="light" onClick={onClick} aria-label={ariaLabel}>
      <Icon className="size-6" />
    </Button>
  </Tooltip>
)
