module.exports = {
  apps: [
    {
      name: "hmjb-api",
      script: "./dist/index.js",
      env: {
        PORT: 5000,
        NODE_ENV: "production",
      },
    },
  ],
};
