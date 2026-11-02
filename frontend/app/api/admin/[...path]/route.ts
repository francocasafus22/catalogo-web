import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";
const allowedResources = new Set(["products", "categories", "uploads", "sales"]);

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (!path.length || path.length > 2 || !allowedResources.has(path[0])) {
    return NextResponse.json({ message: "Ruta no encontrada" }, { status: 404 });
  }

  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return NextResponse.json({ message: "Sesión vencida. Volvé a iniciar sesión." }, { status: 401 });

  try {
    const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
    const upstream = await fetch(`${apiUrl}/admin/${path.map(encodeURIComponent).join("/")}`, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body,
      cache: "no-store",
    });
    const response = new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
    if (upstream.status === 401) response.cookies.delete("admin_token");
    return response;
  } catch {
    return NextResponse.json({ message: "No se pudo conectar con el backend." }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
