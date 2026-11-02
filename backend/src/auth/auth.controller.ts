import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { AuthService, AdminUser } from "./auth.service";
import { LoginDto } from "./auth.dto";

type AuthenticatedRequest = Request & { user: AdminUser };

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  login(@Body() credentials: LoginDto) {
    return this.auth.login(credentials);
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  me(@Req() request: AuthenticatedRequest) {
    return { user: request.user };
  }
}
