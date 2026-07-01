/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow the Next image optimizer to resize/serve WebP for Supabase storage
    // (product photos) and any HTTPS host. Local /public images work automatically.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**"
      }
    ]
  }
};

export default nextConfig;
