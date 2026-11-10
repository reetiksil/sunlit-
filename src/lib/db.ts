import Dexie, { type EntityTable } from "dexie";
import { UploadedBook } from "@/types";

const db = new Dexie("SunlitPagesLocalDB") as Dexie & {
  uploadedBooks: EntityTable<UploadedBook, "id">;
};

db.version(1).stores({
  uploadedBooks: "id, title, format, addedAt",
});

export { db };