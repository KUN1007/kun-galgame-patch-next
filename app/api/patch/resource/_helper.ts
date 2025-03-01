import { uploadLargeFileToS3 } from '~/lib/s3/uploadLargeFileToS3'
import { uploadSmallFileToS3 } from '~/lib/s3/uploadSmallFileToS3'
import { deleteFileFromS3 } from '~/lib/s3/deleteFileFromS3'
import { getKv } from '~/lib/redis'
import { MAX_SMALL_FILE_SIZE } from '~/config/upload'
import type { KunChunkMetadata } from '~/types/api/upload'

export const uploadPatchResource = async (patchId: number, hash: string) => {
  const fileMetadataString = await getKv(hash)
  if (!fileMetadataString) {
    return '本地临时文件元数据未找到, 请重新上传补丁文件'
  }
  const fileMetadata = JSON.parse(fileMetadataString) as KunChunkMetadata
  const fileName = fileMetadata.filepath.split('/').pop()

  const s3Key = `patch/${patchId}/${hash}/${fileName}`
  let res
  if (fileMetadata.fileSize < MAX_SMALL_FILE_SIZE) {
    res = await uploadSmallFileToS3(s3Key, fileMetadata.filepath)
  } else {
    res = await uploadLargeFileToS3(s3Key, fileMetadata.filepath)
  }
  if (typeof res === 'string') {
    return res
  }

  const downloadLink = `${process.env.KUN_VISUAL_NOVEL_S3_STORAGE_URL!}/${s3Key}`
  return { downloadLink }
}

export const deletePatchResource = async (
  content: string,
  id: number,
  hash: string
) => {
  const fileName = content.split('/').pop()
  const s3Key = `patch/${id}/${hash}/${fileName}`
  await deleteFileFromS3(s3Key)
}
