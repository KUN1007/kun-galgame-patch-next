import { Chip } from '@nextui-org/chip'
import type { Patch } from '~/types/api/patch'

interface PatchHeaderProps {
  patch: Patch
}

export const Tags = ({ patch }: PatchHeaderProps) => {
  return (
    <>
      {patch.platform.length > 0 &&
        patch.platform.map((platform) => (
          <Chip key={platform} variant="flat">
            {platform}
          </Chip>
        ))}

      {patch.language.length > 0 &&
        patch.language.map((language) => (
          <Chip key={language} color="primary" variant="flat">
            {language}
          </Chip>
        ))}

      {patch.type.length > 0 &&
        patch.type.map((type) => (
          <Chip key={type} color="primary" variant="solid">
            {type}
          </Chip>
        ))}
    </>
  )
}
