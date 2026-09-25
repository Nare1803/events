import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/invitation/invitation-page";
import { loadInvitation } from "@/lib/invitations/load";
import { invitationMetadata } from "@/lib/invitations/metadata";
import { resolveRenderOptions } from "@/lib/invitations/render-mode";

type Search = { lang?: string | string[]; preview?: string | string[]; embed?: string | string[] };
type Props = { params: Promise<{ eventSlug: string }>; searchParams: Promise<Search> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventSlug } = await params;
  return invitationMetadata(eventSlug);
}

export default async function EventInvitationPage({ params, searchParams }: Props) {
  const [{ eventSlug }, search] = await Promise.all([params, searchParams]);
  const options = await resolveRenderOptions(search);
  const view = await loadInvitation({ eventSlug, ...options });
  if (!view) notFound();
  return <InvitationPage view={view} />;
}
