import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createHash } from "node:crypto";

const uploadFolder = "mariana-shop/product-variants";

@Injectable()
export class CloudinaryService {
  createUploadSignature() {
    const connectionString = process.env.CLOUDINARY_URL;
    if (!connectionString) {
      throw new ServiceUnavailableException("Configurá CLOUDINARY_URL en backend/.env para habilitar las imágenes.");
    }

    let cloudinaryUrl: URL;
    try {
      cloudinaryUrl = new URL(connectionString);
    } catch {
      throw new ServiceUnavailableException("CLOUDINARY_URL no tiene un formato válido.");
    }

    const apiKey = decodeURIComponent(cloudinaryUrl.username);
    const apiSecret = decodeURIComponent(cloudinaryUrl.password);
    const cloudName = cloudinaryUrl.hostname;
    if (
      cloudinaryUrl.protocol !== "cloudinary:" || !apiKey || !cloudName || !apiSecret ||
      /your[_-]?api[_-]?secret|replace-with|placeholder|<|>/i.test(apiSecret)
    ) {
      throw new ServiceUnavailableException("Completá CLOUDINARY_URL con la API secret real de tu entorno Cloudinary.");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signatureBase = `folder=${uploadFolder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash("sha1").update(signatureBase).digest("hex");

    return { cloudName, apiKey, timestamp, signature, folder: uploadFolder };
  }
}
