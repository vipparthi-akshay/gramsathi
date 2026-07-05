import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GramSathi AI",
    short_name: "GramSathi",
    description: "AI-Powered Government Services for Rural Citizens",
    start_url: "/",
    display: "standalone",
    background_color: "#1565C0",
    theme_color: "#1565C0",
    orientation: "portrait-primary",
    categories: ["government", "utilities", "productivity"],
    lang: "hi",
    dir: "ltr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home.png",
        sizes: "1080x1920",
        type: "image/png",
      },
    ],
  };
}
