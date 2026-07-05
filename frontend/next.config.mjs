/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Base64 data URLs are used for all rendered images, so no remote image config
  // is required. The backend URL is read from NEXT_PUBLIC_API_URL at runtime.
};

export default nextConfig;
