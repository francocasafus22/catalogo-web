import { permanentRedirect } from "next/navigation";

export default async function LegacyProductPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product } = await params;
  permanentRedirect(`/producto/${product}`);
}
