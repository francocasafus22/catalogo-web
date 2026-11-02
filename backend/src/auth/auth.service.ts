import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { DatabaseService } from "../database.service";
import { LoginDto } from "./auth.dto";

export type AdminUser = { id: string; email: string; role: "admin" };

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService, private readonly jwt: JwtService) {}

  async login(credentials: LoginDto) {
    const email = credentials.email.trim().toLowerCase();
    const result = await this.db.query(
      "SELECT id, email, password_hash FROM admins WHERE email = $1",
      [email],
    );
    const admin = result.rows[0];
    const valid = admin && await bcrypt.compare(credentials.password, admin.password_hash);
    if (!valid) throw new UnauthorizedException("Email o contraseña incorrectos");

    const user: AdminUser = { id: String(admin.id), email: admin.email, role: "admin" };
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return { accessToken, user };
  }
}
