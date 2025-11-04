import {
  bgmGetSubject,
  bgmGetSubjectCharacters,
  bgmGetPerson
} from './bangumi.js'

async function main() {
  try {
    const subjectId = 2 // arbitrary test id
    console.log('Testing Bangumi subject fetch...')
    const subj = await bgmGetSubject(subjectId)
    console.log('subject:', {
      id: subj?.id,
      name: subj?.name,
      name_cn: subj?.name_cn
    })
    console.log('Testing Bangumi subject characters...')
    const chars = await bgmGetSubjectCharacters(subjectId)
    console.log('chars count:', chars?.length)
    if (chars?.[0]) {
      const cdetail = await bgmGetPerson(chars[0].id).catch(() => null)
      console.log('first char summary len:', (cdetail?.summary || '').length)
    }
  } catch (e) {
    console.error('Bangumi test failed:', e?.message || e)
  }
}

main()
