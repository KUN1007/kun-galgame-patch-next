import { Button } from '@nextui-org/button'
import { Upload } from 'lucide-react'

interface SubmitButtonProps {
  creating: boolean
}

export const SubmitButton = ({ creating }: SubmitButtonProps) => (
  <Button
    type="submit"
    color="primary"
    startContent={<Upload className="w-4 h-4" />}
    disabled={creating}
    isLoading={creating}
  >
    发布资源
  </Button>
)
