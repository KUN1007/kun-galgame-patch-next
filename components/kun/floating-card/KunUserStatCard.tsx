import { Card } from '@nextui-org/card'

interface UserStatCardProps {
  value: number
  label: string
}

export const KunUserStatCard = ({ value, label }: UserStatCardProps) => {
  return (
    <div className="p-2 text-center border shadow rounded-2xl bg-background/30">
      <p className="font-semibold">{value.toLocaleString()}</p>
      <p className="text-tiny text-default-500">{label}</p>
    </div>
  )
}
