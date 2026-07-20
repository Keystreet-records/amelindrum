/** Google Fonts — кириллица: Golos Text (текст), Onest (заголовки) */
export const FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Onest:wght@500;600;700;800&display=swap";

export const FONT_LINKS = [
  { rel: "preconnect" as const, href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect" as const,
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous" as const,
  },
  { rel: "stylesheet" as const, href: FONT_STYLESHEET },
];
