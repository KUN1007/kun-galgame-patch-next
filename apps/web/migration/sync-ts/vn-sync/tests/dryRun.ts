import { syncPatchesToS3Dry } from '../../_syncPatchesToS3Dry'

async function main() {
  const res = await syncPatchesToS3Dry()
  console.log(JSON.stringify(res, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

