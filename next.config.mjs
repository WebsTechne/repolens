/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["ts-morph", "typescript", "@esbuild/win32-x64"],
  outputFileTracingIncludes: {
    "/api/upload": ["./worker-dist/**"],
  },
}

export default nextConfig
