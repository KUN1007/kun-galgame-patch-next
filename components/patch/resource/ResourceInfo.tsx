import { Snippet } from '@heroui/snippet'
import { KunPatchAttribute } from '~/components/kun/PatchAttribute'
import type { PatchResourceHtml } from '~/types/api/patch'

interface Props {
  resource: PatchResourceHtml
}

export const ResourceInfo = ({ resource }: Props) => {
  return (
    <div className="space-y-2">
      <KunPatchAttribute
        types={resource.type}
        languages={resource.language}
        platforms={resource.platform}
        modelName={resource.modelName}
        downloadCount={resource.download}
      />
    </div>
  )
}
