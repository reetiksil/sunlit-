import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { SEED_BOOKS } from "@/data/seed";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/browse", "/bookshelf", "/read-your-own", "/login", "/register"].map(
    (route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date(),
    })
  );

  const bookRoutes = SEED_BOOKS.map((book) => ({
    url: `${siteConfig.url}/book/${book.slug}`,
    lastModified: new Date(book.updatedAt),
  }));

  return [...staticRoutes, ...bookRoutes];
}