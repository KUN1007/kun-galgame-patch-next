import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const isWindows = os.platform() === 'win32'

const copyDirectory = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

const copyFiles = () => {
  exec(
    'next-sitemap --config next-sitemap.config.js',
    (error, stdout, stderr) => {
      if (error) {
        console.error('Error generating sitemap:', error)
        process.exit(1)
      }
      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)

      if (isWindows) {
        console.log('Detected Windows OS. Using fs module for copying files.')
        try {
          copyDirectory('public', '.next/standalone/public')
          copyDirectory('.next/static', '.next/standalone/.next/static')
          console.log('Files copied successfully.')
        } catch (fsError) {
          console.error('Error copying files using fs:', fsError)
          process.exit(1)
        }
      } else {
        console.log(
          'Detected non-Windows OS. Using cp command for copying files.'
        )
        const commands = [
          'cp -r public .next/standalone/',
          'cp -r .next/static .next/standalone/.next/'
        ]

        commands.forEach((command) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing command "${command}":`, error)
              process.exit(1)
            }
            if (stdout) console.log(stdout)
            if (stderr) console.error(stderr)
          })
        })
      }
    }
  )
}

copyFiles()
