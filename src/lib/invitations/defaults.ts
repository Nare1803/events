import { serializeLocalized, type LocalizedText } from "@/lib/i18n/localized";

/** Starter copy for new events, so a fresh invitation already reads beautifully. */
export const DEFAULT_COPY: Record<"heroSubtitle" | "welcomeText" | "invitationText" | "closingText", LocalizedText> = {
  heroSubtitle: {
    en: "We found forever.",
    hy: "Մենք գտանք մեր հավերժությունը։",
    ru: "Мы нашли свою вечность.",
  },
  welcomeText: {
    en: "Some moments are too special not to share.\nWe would love you to be part of ours.",
    hy: "Կան պահեր, որոնք չափազանց թանկ են՝ չկիսվելու համար։\nՇատ կցանկանայինք, որ Դուք լինեիք մեր այս պահի մասը։",
    ru: "Некоторые мгновения слишком прекрасны, чтобы не разделить их.\nМы будем счастливы, если вы станете частью нашего.",
  },
  invitationText: {
    en: "Together with our families, we invite you to celebrate our wedding day with us.",
    hy: "Մեր ընտանիքների հետ միասին հրավիրում ենք Ձեզ նշելու մեր հարսանյաց օրը։",
    ru: "Вместе с нашими семьями мы приглашаем вас разделить с нами день нашей свадьбы.",
  },
  closingText: {
    en: "We can't wait\nto celebrate with you",
    hy: "Անհամբեր սպասում ենք\nայս օրը Ձեզ հետ նշելուն",
    ru: "С нетерпением ждём\nвстречи с вами",
  },
};

export function defaultCopyJson(key: keyof typeof DEFAULT_COPY): string {
  return serializeLocalized(DEFAULT_COPY[key]);
}
