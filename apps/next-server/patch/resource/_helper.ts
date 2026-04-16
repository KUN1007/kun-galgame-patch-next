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

/**
 * Removes the first occurrence of a given subsequence (`toRemove`) from the array (`arr`)
 * and then returns a new array with duplicate values removed.
 *
 * Key behavior:
 * - `toRemove` is treated as an exact ordered subsequence of `arr`, not just a set of values.
 * - The function scans through `arr` and removes the first set of elements that match
 *   the full order and content of `toRemove`.
 * - If the full subsequence is not found in order, the original array is returned with duplicates removed.
 * - The final result is deduplicated using a Set (preserving first occurrences).
 *
 * Example:
 *   arr = ['a', 'b', 'c', 'a', 'd', 'e']
 *   toRemove = ['b', 'c']
 *   → remove first subsequence ['b', 'c'], result = ['a', 'a', 'd', 'e']
 *   → deduplicate, final = ['a', 'd', 'e']
 */
export const _removeSubsequenceOnceAndDeduplicate = <T>(
  arr: T[],
  toRemove: T[]
): T[] => {
  if (toRemove.length === 0) {
    return [...new Set(arr)]
  }

  const indicesToRemove = new Set<number>()
  let currentToRemoveIndex = 0

  for (let i = 0; i < arr.length; i++) {
    if (
      currentToRemoveIndex < toRemove.length &&
      arr[i] === toRemove[currentToRemoveIndex]
    ) {
      indicesToRemove.add(i)
      currentToRemoveIndex++
      if (currentToRemoveIndex === toRemove.length) {
        break
      }
    }
  }

  if (currentToRemoveIndex < toRemove.length && toRemove.length > 0) {
    return [...new Set(arr)]
  }

  const arrayAfterRemoval: T[] = []
  for (let i = 0; i < arr.length; i++) {
    if (!indicesToRemove.has(i)) {
      arrayAfterRemoval.push(arr[i])
    }
  }

  const deduplicatedArray = [...new Set(arrayAfterRemoval)]

  return deduplicatedArray
}
