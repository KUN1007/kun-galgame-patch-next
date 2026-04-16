import { stat } from 'fs/promises'
import { uploadSmallFileToS3 } from '../../../lib/s3/uploadSmallFileToS3'
import { uploadLargeFileToS3 } from '../../../lib/s3/uploadLargeFileToS3'
import { MAX_SMALL_FILE_SIZE } from '../../../config/upload'
import { uploadPatchBanner as _uploadPatchBanner } from '../../../app/api/utils/uploadPatchBanner'
import { sanitizeFileName } from '../../../utils/sanitizeFileName'

export async function uploadBannerForPatch(patchId: number, image: ArrayBuffer) {
  const res = await _uploadPatchBanner(image, patchId)
  if (typeof res === 'string') return res
  const link = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/patch/${patchId}/banner/banner.avif`
  return { link }
}

export async function uploadPatchFileToS3(
  patchId: number,
  hash: string,
  filePath: string
) {
  const rawName = filePath.split(/[\\/]/).pop()!
  const fileName = sanitizeFileName(rawName)
  const s3Key = `patch/${patchId}/${hash}/${fileName}`
  const st = await stat(filePath)
  if (st.size < MAX_SMALL_FILE_SIZE) {
    const r = await uploadSmallFileToS3(s3Key, filePath)
    if (typeof r === 'string') return r
  } else {
    const r = await uploadLargeFileToS3(s3Key, filePath)
    if (typeof r === 'string') return r
  }
  const url = `${process.env.KUN_VISUAL_NOVEL_S3_STORAGE_URL}/${s3Key}`
  return { url }
}
