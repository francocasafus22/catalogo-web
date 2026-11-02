import { Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CloudinaryService } from "./cloudinary.service";

@Controller("admin/uploads")
@UseGuards(AuthGuard("jwt"))
export class CloudinaryController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post("signature")
  createSignature() {
    return this.cloudinary.createUploadSignature();
  }
}
