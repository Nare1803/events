import Image from "next/image";
import { ItemActions } from "@/components/admin/item-actions";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/primitives";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { MAX_GALLERY_IMAGES } from "@/lib/invitations/limits";
import { deleteGalleryImageAction, updateGalleryAltAction, uploadGalleryImagesAction } from "@/server/actions/gallery";
import { moveGalleryImageAction } from "@/server/actions/program";

export default async function GalleryPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const images = await db.galleryImage.findMany({ where: { eventId: event.id }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  const room = MAX_GALLERY_IMAGES - images.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gallery"
        description={`Your story in ${MAX_GALLERY_IMAGES} photos or fewer, laid out as an editorial spread. Order matters: the first photo is shown largest.`}
      />

      <Card>
        <CardHeader title="Add photos" description={room > 0 ? `${room} of ${MAX_GALLERY_IMAGES} spaces left. Photos are resized and converted to WebP; location data is removed.` : "The gallery is full — remove a photo to add another."} />
        {room > 0 && (
          <ActionForm key={images.length} action={uploadGalleryImagesAction.bind(null, event.id)} className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="gallery-photos" className="mb-1.5 block text-sm font-medium text-stone-800">
                Photos
              </label>
              <input
                id="gallery-photos"
                name="photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif,image/heic"
                className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-espresso hover:file:bg-stone-200"
              />
            </div>
            <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
          </ActionForm>
        )}
      </Card>

      {images.length === 0 ? (
        <EmptyState title="No photos yet" description="The gallery section is hidden from guests until you add photos." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <Card key={image.id} className="flex flex-col gap-3 p-3 sm:p-3">
              <div className="relative overflow-hidden rounded-lg bg-stone-100" style={{ aspectRatio: `${image.width} / ${image.height}`, maxHeight: 320 }}>
                <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium">{index + 1}</span>
              </div>
              <ActionForm action={updateGalleryAltAction.bind(null, event.id, image.id)} className="flex items-end gap-2">
                <TextField name="alt" label="Description (for screen readers)" defaultValue={image.alt} maxLength={160} className="flex-1" />
                <SubmitButton variant="secondary">Save</SubmitButton>
              </ActionForm>
              <ItemActions
                label={`photo ${index + 1}`}
                move={moveGalleryImageAction.bind(null, event.id, image.id)}
                remove={deleteGalleryImageAction.bind(null, event.id, image.id)}
                confirmText="Remove this photo from the gallery?"
                isFirst={index === 0}
                isLast={index === images.length - 1}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
