import { z } from "zod";
import { siteConfig } from "@/config/site";
import { TEXT_LIMITS } from "@/lib/textBlocks";

const EXT = /\.(epub|pdf|txt|md|markdown)$/i;
const TEXT_EXT = /\.(txt|md|markdown)$/i;

export const SUPPORTED_EXTENSIONS_LABEL = ".epub, .pdf, .txt or .md";

export const uploadFileSchema = z
  .object({ name: z.string(), size: z.number() })
  .superRefine((file, ctx) => {
    if (!EXT.test(file.name)) {
      ctx.addIssue({ code: "custom", path: ["name"], message: `Unsupported file type. Please choose an ${SUPPORTED_EXTENSIONS_LABEL} file.` });
      return;
    }
    if (!(file.size > 0)) {
      ctx.addIssue({ code: "custom", path: ["size"], message: "The selected file appears to be empty." });
      return;
    }
    const isText = TEXT_EXT.test(file.name);
    const max = isText ? TEXT_LIMITS.maxFileBytes : siteConfig.maxUploadSizeBytes;
    if (file.size > max) {
      const label = isText ? `${TEXT_LIMITS.maxFileBytes / (1024 * 1024)} MB` : `${siteConfig.maxUploadSizeMB} MB`;
      ctx.addIssue({ code: "custom", path: ["size"], message: `File exceeds the ${label} limit for this file type.` });
    }
  });

export function validateBookFile(file: { name: string; size: number }) {
  return uploadFileSchema.safeParse(file);
}

export function formatFromName(name: string): "epub" | "pdf" | "txt" {
  const n = name.toLowerCase();
  if (n.endsWith(".epub")) return "epub";
  if (n.endsWith(".pdf")) return "pdf";
  return "txt";
}
