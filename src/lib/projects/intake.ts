/**
 * The customer's brief as submitted through the order form. Stored as a JSON
 * snapshot on the project so staff always see exactly what the customer asked for,
 * even after the invitation itself has been edited.
 */
export type MusicChoice = "UPLOAD" | "REFERENCE" | "NONE" | "RECOMMEND";

export type IntakeBrief = {
  vibe?: string[];
  writeForMe?: boolean;
  welcomeText?: string;
  music?: { choice?: MusicChoice; reference?: string; rightsConfirmedByCustomer?: boolean };
  dressCode?: { name?: string; description?: string; colors?: string[] };
  rsvpFields?: string[];
  rsvpDeadline?: string;
  guestList?: { provided?: boolean; count?: number; later?: boolean };
  notes?: string;
  languages?: string[];
  packageKey?: string;
};

export const VIBES = ["Elegant", "Romantic", "Minimal", "Modern", "Traditional", "Intimate", "Glamorous"] as const;

export const RSVP_FIELD_LABELS: Record<string, string> = {
  attendance: "Attendance",
  guestCount: "Guest count",
  companions: "Companion names",
  transportation: "Transportation",
  dietary: "Dietary restrictions",
  message: "Message to the couple",
  phone: "Phone number",
};

export const MUSIC_CHOICE_LABELS: Record<MusicChoice, string> = {
  UPLOAD: "Uploaded their own song",
  REFERENCE: "Suggested a song",
  NONE: "No music",
  RECOMMEND: "Asked ORÉ to recommend",
};

export function parseBrief(raw: string | null | undefined): IntakeBrief {
  try {
    const value: unknown = JSON.parse(raw || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? (value as IntakeBrief) : {};
  } catch {
    return {};
  }
}
