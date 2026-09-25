import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { SelectField, TextField, Toggle } from "@/components/forms/fields";
import { Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { MUSIC_CHOICE_LABELS, parseBrief } from "@/lib/projects/intake";
import { updateMusicAction } from "@/server/actions/events";

export default async function MusicPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const [music, project] = await Promise.all([
    db.musicSettings.findUnique({ where: { eventId: event.id } }),
    db.invitationProject.findUnique({
      where: { eventId: event.id },
      select: { intake: true, files: { where: { kind: "MUSIC" }, select: { id: true, url: true, originalName: true } } },
    }),
  ]);
  const wish = parseBrief(project?.intake).music;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Music"
        description="Music begins softly when a guest taps “Open invitation” — never before. Guests can pause or mute it at any time."
      />

      {(wish?.choice || (project?.files.length ?? 0) > 0) && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader title="The customer's wish" />
          <p className="text-sm">{wish?.choice ? MUSIC_CHOICE_LABELS[wish.choice] : "—"}</p>
          {wish?.reference && <p className="mt-1 text-sm text-stone-700">{wish.reference}</p>}
          {project?.files.map((file) => (
            <div key={file.id} className="mt-3">
              <p className="mb-1 text-xs text-stone-500">
                Uploaded by the customer: {file.originalName} ·{" "}
                {wish?.rightsConfirmedByCustomer ? "customer confirmed they may use it" : "rights not confirmed by the customer"}
              </p>
              <audio controls preload="none" src={file.url} className="w-full" />
            </div>
          ))}
          <p className="mt-3 text-xs text-stone-600">
            Only publish music the couple owns, that is licensed for this use, or that ORÉ has licensed. To use the customer&apos;s file, download it
            and upload it below after checking the rights.
          </p>
        </Card>
      )}

      <ActionForm action={updateMusicAction.bind(null, event.id)}>
        <Card>
          <CardHeader title="Background music" />
          <Toggle name="enabled" label="Play music" description="Shows a small player in the corner of the invitation." defaultChecked={music?.enabled ?? false} />

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-stone-800">Current track</p>
              {music?.trackUrl ? (
                <>
                  <audio controls preload="none" src={music.trackUrl} className="w-full">
                    Your browser does not support audio playback.
                  </audio>
                  <label className="flex items-center gap-2 text-sm text-stone-600">
                    <input type="checkbox" name="removeTrack" className="h-4 w-4 accent-espresso" />
                    Remove this track
                  </label>
                </>
              ) : (
                <p className="text-sm text-stone-500">No track uploaded yet.</p>
              )}
              <div>
                <label htmlFor="track-file" className="mb-1.5 block text-sm font-medium text-stone-800">
                  {music?.trackUrl ? "Replace track" : "Upload track"}
                </label>
                <input
                  id="track-file"
                  name="trackFile"
                  type="file"
                  accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/wav"
                  className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-espresso hover:file:bg-stone-200"
                />
                <p className="mt-1 text-xs text-stone-500">MP3 or M4A up to 12 MB.</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <SelectField
                name="source"
                label="Source"
                defaultValue={music?.source === "LIBRARY" ? "LIBRARY" : "UPLOAD"}
                options={[
                  { value: "UPLOAD", label: "Provided by the couple" },
                  { value: "LIBRARY", label: "ORÉ licensed library" },
                ]}
              />
              <TextField name="licenseNote" label="Rights / licence note" defaultValue={music?.licenseNote} maxLength={300} placeholder="e.g. Artlist licence #1234, or “Composed for the couple”" />
              <Toggle
                name="rightsConfirmed"
                label="Rights confirmed"
                description="Required before music can play. Confirms the track is owned by the couple or licensed for this use."
                defaultChecked={music?.rightsConfirmed ?? false}
              />
              <TextField name="title" label="Track title (optional)" defaultValue={music?.title} maxLength={120} />
              <TextField name="artist" label="Artist (optional)" defaultValue={music?.artist} maxLength={120} />
              <TextField name="volume" label="Volume" type="range" min={10} max={100} step={5} defaultValue={music?.volume ?? 60} hint="Keep it gentle — around 50–60% works well." />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <SubmitButton>Save music</SubmitButton>
          </div>
        </Card>
      </ActionForm>
    </div>
  );
}
