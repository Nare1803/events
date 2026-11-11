import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { ColorField } from "@/components/forms/color-field";
import { TextField, Toggle } from "@/components/forms/fields";
import { TemplatePreview } from "@/components/site/template-preview";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { DEFAULT_THEME_ID, THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";
import { updateDesignAction } from "@/server/actions/events";

export default async function DesignPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const design = await db.designSettings.findUnique({ where: { eventId: event.id } });
  const current = design?.themeId ?? DEFAULT_THEME_ID;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Template" description="The template controls presentation; the event data controls content. Every template works in Armenian, English and Russian." />
      <ActionForm action={updateDesignAction.bind(null, event.id)} className="flex flex-col gap-6" guard>
        <Card>
          <CardHeader title="Theme" />
          <fieldset>
            <legend className="sr-only">Theme</legend>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-6">
              {THEMES.map((theme) => {
                return (
                  <label
                    key={theme.id}
                    className={cn(
                      "relative flex flex-col overflow-hidden rounded-xl border transition-shadow",
                      theme.available ? "cursor-pointer has-[:checked]:border-espresso has-[:checked]:ring-2 has-[:checked]:ring-espresso" : "cursor-not-allowed opacity-60",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-espresso",
                    )}
                  >
                    <input
                      type="radio"
                      name="themeId"
                      value={theme.id}
                      defaultChecked={theme.id === current}
                      disabled={!theme.available}
                      className="sr-only"
                    />
                    {/* The same miniature as the website, so the studio picks by the real look. */}
                    <div className="flex justify-center bg-stone-100 px-6 py-4">
                      <div className="w-full max-w-40 overflow-hidden rounded-md text-[6.5px] shadow-sm ring-1 ring-black/5">
                        <TemplatePreview tokens={theme.tokens} heroVariant={theme.variants.hero} muted={!theme.available} />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 border-t border-stone-200 bg-white p-3">
                      <span className="flex items-center justify-between gap-2 text-sm font-medium">
                        {theme.name}
                        {!theme.available && <Badge>Coming soon</Badge>}
                      </span>
                      <span className="text-xs text-stone-500">{theme.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </Card>

        <Card>
          <CardHeader title="Details" />
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Toggle name="useAccent" label="Custom accent colour" description="Overrides the theme accent used for small labels and details." defaultChecked={!!design?.accentColor} />
              <ColorField name="accentColor" label="Accent colour" defaultValue={design?.accentColor ?? "#6F5D53"} />
              <p className="mt-1 text-xs text-stone-500">Choose a deep tone so small text stays readable.</p>
            </div>
            <div>
              <Toggle name="showMonogram" label="Show monogram" description="Initials in the hero and closing section." defaultChecked={design?.showMonogram ?? true} />
              <TextField
                name="heroOverlay"
                label="Hero image darkening"
                type="range"
                min={0}
                max={80}
                step={5}
                defaultValue={design?.heroOverlay ?? 35}
                hint="Increase if your names are hard to read over a bright photo."
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <SubmitButton>Save design</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
