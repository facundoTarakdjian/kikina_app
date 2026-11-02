import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kikiña",
    short_name: "Ki<i",
    description: "Nuestra vida en recuerdos",
    start_url: "/inicio",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F2EA",
    theme_color: "#F7F2EA",
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
