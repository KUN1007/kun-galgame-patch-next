const path = require('path')

module.exports = {
  apps: [
    {
      name: 'kun-visual-novel-patch',
      port: 2333,
      cwd: path.join(__dirname),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      script: './.next/kun/server.js'
    }
  ]
}
