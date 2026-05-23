/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: false,
  serverExternalPackages: [
    "ts-morph",
    "typescript",
    "@esbuild/win32-x64",
    "@esbuild/win32-x64",
    "worker_threads",
  ],
}

export default nextConfig
