import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const updateResourceUpdateTime = async () => {
  try {
    const resources = await prisma.patch_resource.findMany({
      select: {
        id: true,
        created: true
      }
    })

    for (const resource of resources) {
      await prisma.patch_resource.update({
        where: { id: resource.id },
        data: {
          update_time: resource.created
        }
      })

      console.log(`Updated resource with id: ${resource.id}`)
    }

    console.log('Successfully updated all resource records.')
  } catch (error) {
    console.error('Error updating resource records:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateResourceUpdateTime()
