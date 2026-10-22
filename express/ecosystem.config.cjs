// pm2 settings for the Express server on the VM: pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [{
    name: "server",
    script: "server.js",
    cwd: "/home/opc/express-build",
    // timestamps on each log line (the old --time flag)
    time: true,
    // a safety net instead of a scheduled daily restart: pm2 restarts the server
    // only if its memory goes over this (it normally sits around 80MB)
    max_memory_restart: "300M",
  }],
};
