/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require("path").join(__dirname),
  serverExternalPackages: ["@prisma/client", "prisma"],
};
module.exports = nextConfig;
