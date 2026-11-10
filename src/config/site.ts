export const siteConfig = {
  name: "Sunlit Pages", // Change "[SITE NAME]" here in one place
  tagline: "A quiet corner for stories, sunlit mornings, and peaceful nights.",
  description:
    "A minimal, distraction-free online book and light-novel sanctuary with local EPUB & PDF support.",
  url: "https://sunlitpages.example.com",
  maxUploadSizeMB: 25,
  maxUploadSizeBytes: 25 * 1024 * 1024,
  allowedMimeTypes: ["application/epub+zip", "application/pdf"] as const,
  allowedExtensions: [".epub", ".pdf"] as const,
  links: {
    github: "https://github.com/example/sunlit-pages",
  },
} as const;

export type SiteConfig = typeof siteConfig;