// import { Client } from '@microsoft/microsoft-graph-client'
// import fs from 'fs'

// export const uploadToOneDrive = async (accessToken: string, file: File) => {
//   const client = Client.init({
//     authProvider: (done) => done(null, accessToken)
//   })

//   const fileStream = fs.createReadStream(file.filepath)

//   try {
//     const response = await client
//       .api(`/me/drive/root:/uploads/${file.originalFilename}:/content`)
//       .put(fileStream)

//     return response
//   } catch (error) {
//     throw new Error(error)
//   }
// }
