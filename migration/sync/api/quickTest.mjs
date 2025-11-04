import { vndbGetStaffByIds, vndbGetCharactersByIds } from './vndb.js'

async function main() {
  try {
    console.log('Testing VNDB /staff fetch...')
    const staff = await vndbGetStaffByIds(['s81', 's3'])
    console.log('staff count:', staff.length)
    if (staff[0])
      console.log('staff[0] sample:', {
        id: staff[0].id,
        name: staff[0].name,
        lang: staff[0].lang,
        aliases: staff[0].aliases?.slice?.(0, 2)
      })
  } catch (e) {
    console.error('Staff test failed:', e?.message || e)
  }
  try {
    console.log('Testing VNDB /character fetch...')
    const chars = await vndbGetCharactersByIds(['c17', 'c103'])
    console.log('chars count:', chars.length)
    if (chars[0])
      console.log('chars[0] sample:', {
        id: chars[0].id,
        name: chars[0].name,
        gender: chars[0].gender,
        birthday: chars[0].birthday,
        vns: chars[0].vns?.slice?.(0, 2)
      })
  } catch (e) {
    console.error('Character test failed:', e?.message || e)
  }
}

main()
