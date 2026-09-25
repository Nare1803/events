import { buildGuestCsv, csvResponse } from "@/lib/guests/export";
import { findProjectByToken } from "@/lib/projects/review";

/** The couple's guest list download — authorised by their private link, only once published. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const project = await findProjectByToken(token);
  if (!project || project.status !== "PUBLISHED") return new Response("Not found", { status: 404 });
  return csvResponse(await buildGuestCsv(project.event), project.event.slug);
}
