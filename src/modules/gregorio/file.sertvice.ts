
import fs from "fs";
import path from "path";
import mime from "mime-types";

export class FileService {

  private base = path.join(process.cwd(), "public");

  async getFile(name: string) {

    if (!name || name.includes("..")) {
      throw new Error("Invalid path");
    }

    // lokasi file (semua gabung di folder ini)
    const filePath = path.join(this.base, name);

    if (!fs.existsSync(filePath)) {
      throw new Error("Not found");
    }

    // baca file
    const buffer = fs.readFileSync(filePath);

    // otomatis baca mime
    const mimeType = mime.lookup(name) || "application/octet-stream";

    return {
      buffer,
      mime: mimeType
    };
  }
}
