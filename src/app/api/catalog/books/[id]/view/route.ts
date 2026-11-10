import { json } from "@/lib/server/guard";
import { recordBookView } from "@/lib/server/catalog";
import { clientIp } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ip = clientIp(req);
  const views = await recordBookView(params.id, ip);
  return json({ views });
}
