
import fs from "fs";
import path from "path";
import mime from "mime-types";

export class FileService {
  private base = path.join(process.cwd(), "public");

  getDiskPath(name: string) {
    if (!name || name.includes("..")) throw new Error("Invalid path");
    return path.join(this.base, name);
  }

  getPublicUrl(name: string) {
    if (!name || name.includes("..")) throw new Error("Invalid path");
    return `https://api.gregdiovani.my.id/uploads/${encodeURIComponent(name)}`;
  }
}
