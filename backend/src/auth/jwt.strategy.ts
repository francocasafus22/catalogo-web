import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AdminUser } from "./auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>("JWT_SECRET");
    if (!secret || secret.length < 32) {
      throw new Error("JWT_SECRET debe tener al menos 32 caracteres en backend/.env");
    }
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: secret });
  }

  validate(payload: { sub?: string; email?: string; role?: string }): AdminUser {
    if (!payload.sub || !payload.email || payload.role !== "admin") {
      throw new UnauthorizedException();
    }
    return { id: payload.sub, email: payload.email, role: "admin" };
  }
}
