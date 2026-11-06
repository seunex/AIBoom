/** PM2 config for Downstream on CloudPanel (Vultr). */
module.exports = {
  apps: [
    {
      name: "aiboom",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      min_uptime: "5s",
      exp_backoff_restart_delay: 1000,
      kill_timeout: 8000,
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3002",
        SITE_URL: process.env.SITE_URL || "https://aiboom.news",
      },
    },
  ],
};
