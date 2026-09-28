import type { MetadataRoute } from "next";

// PWA manifest — makes the portal installable ("Add to Home Screen").
// A service worker (offline + push notifications) is added with the Notifications module.
export default function manifest(): MetadataRoute.Manifest {
  const name = process.env.NEXT_PUBLIC_AGENCY_NAME || "Studio Portal";
  return {
    name,
    short_name: name,
    description: "Your projects, deliverables and requests in one place.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f5f2",
    theme_color: "#f6f5f2",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
