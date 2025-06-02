import path from 'path'

export default {
  apps: [
    {
      name: 'kun-visual-novel-patch',
      port: 2333,
      cwd: path.join(__dirname),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      script: './.next/standalone/server.js'
    }
  ]
}
