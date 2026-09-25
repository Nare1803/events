import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/invitation/invitation-page";
import { loadInvitation } from "@/lib/invitations/load";
import { invitationMetadata } from "@/lib/invitations/metadata";
import { resolveRenderOptions } from "@/lib/invitations/render-mode";

type Search = { lang?: string | string[]; preview?: string | string[]; embed?: string | string[] };
type Props = { params: Promise<{ eventSlug: string; guestSlug: string }>; searchParams: Promise<Search> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventSlug } = await params;
  const metadata = await invitationMetadata(eventSlug);
  // Personal links are never indexed, regardless of the event setting.
  return { ...metadata, robots: { index: false, follow: false, nocache: true } };
}

export default async function GuestInvitationPage({ params, searchParams }: Props) {
  const [{ eventSlug, guestSlug }, search] = await Promise.all([params, searchParams]);
  const options = await resolveRenderOptions(search);
  const view = await loadInvitation({ eventSlug, guestSlug, ...options });
  if (!view) notFound();
  return <InvitationPage view={view} />;
}
