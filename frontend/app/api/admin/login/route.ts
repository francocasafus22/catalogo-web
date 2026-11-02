import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: result.message ?? "No se pudo iniciar sesión." },
        { status: response.status },
      );
    }

    const nextResponse = NextResponse.json({ user: result.user });
    nextResponse.cookies.set("admin_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return nextResponse;
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar con el servidor. Verificá que el backend esté iniciado." },
      { status: 503 },
    );
  }
}
