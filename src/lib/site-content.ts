import { polishBody, polishTitle } from "@/lib/typography";

export type SiteContent = {
  hero: {
    name1: string;
    name2: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  marquee: string[];
  about: {
    eyebrow: string;
    heading: string;
    /** Public image URL; empty = bundled default portrait */
    imageUrl: string;
    paragraphs: string[];
    stats: { n: string; l: string }[];
  };
  services: {
    eyebrow: string;
    heading: string;
    items: { n: string; t: string; d: string; tags: string[] }[];
  };
  portfolio: {
    eyebrow: string;
    heading: string;
    videos: PortfolioVideo[];
  };
  experience: {
    eyebrow: string;
    heading: string;
    items: { y: string; t: string; d: string }[];
  };
  contact: {
    eyebrow: string;
    heading: string;
    description: string;
    email: string;
    phone: string;
    socials: { label: string; url: string }[];
  };
};

export type PortfolioVideo = {
  title: string;
  desc: string;
  tags: string[];
  /** youtube/vk = embed URL; file = uploaded video on Vercel Blob */
  source: "youtube" | "vk" | "file";
  url: string;
  /** Custom carousel cover URL; empty = platform auto thumb or site fallback */
  coverUrl: string;
};

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    name1: "АРКАДИЙ",
    name2: "АМЕЛИН",
    description:
      "Профессиональный музыкант с 15-летним опытом. Студийные записи, концерты\nс артистами и индивидуальные занятия\nдля тех, кто хочет научиться слышать ритм.",
    ctaPrimary: "Записаться на сессию",
    ctaSecondary: "Уроки игры",
  },
  marquee: ["STUDIO", "LIVE", "TEACHING", "GROOVE", "RECORDING", "TOUR"],
  about: {
    eyebrow: "Обо мне",
    heading: "Ритм — это язык, которому можно научить",
    imageUrl: "/media/portrait.jpg",
    paragraphs: [
      "Меня зовут Аркадий Амелин. Я работаю с артистами в студии и на сцене, записываю барабаны для авторских проектов и саундтреков, преподаю — от первых ударов до сценической свободы",
      "Окончил консерваторию по классу ударных инструментов. Играл в составах джазовых, рок- и поп-проектов, выступал на крупных российских и международных площадках, участвовал в студийных сессиях для лейблов и независимых артистов",
    ],
    stats: [
      { n: "200+", l: "Концертов" },
      { n: "80+", l: "Студийных сессий" },
      { n: "60+", l: "Учеников" },
    ],
  },
  services: {
    eyebrow: "Услуги",
    heading: "Три направления — один подход",
    items: [
      {
        n: "01",
        t: "Студийные сессии",
        d: "Запись барабанов для альбомов, синглов, рекламы и кино",
        tags: ["Recording", "Online"],
      },
      {
        n: "02",
        t: "Концертные выступления",
        d: "Поддержка артистов на турах, фестивалях и сольных шоу",
        tags: ["Live", "Tour"],
      },
      {
        n: "03",
        t: "Преподавание",
        d: "Индивидуальные уроки в студии и онлайн",
        tags: ["Beginner → Pro"],
      },
    ],
  },
  portfolio: {
    eyebrow: "Портфолио",
    heading: "Видеозаписи и клипы",
    videos: [
      {
        title: "Live at Moscow Arena — 2024",
        desc: "Концертное выступление с хедлайнером. Полный сет, 32 концерта по туру",
        tags: ["Live", "Tour 2024"],
        source: "youtube",
        url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
        coverUrl: "",
      },
      {
        title: "Студийная сессия «Северный ветер»",
        desc: "Запись барабанов для альбома. 11 треков, живое звучание, акустические барабаны",
        tags: ["Studio", "Album"],
        source: "youtube",
        url: "https://www.youtube.com/watch?v=2vjPBrBU-TM",
        coverUrl: "",
      },
      {
        title: "Jazz Club Session — Usadba Jazz",
        desc: "Камерное выступление в составе квинтета. Импровизация, чтение, groove",
        tags: ["Jazz", "Festival"],
        source: "youtube",
        url: "https://www.youtube.com/watch?v=GHVDVz9Z6qk",
        coverUrl: "",
      },
      {
        title: "Groove Clinic — мастер-класс",
        desc: "Открытый урок по груву и динамике. Разбор паттернов и сценической подачи",
        tags: ["Clinic", "Teaching"],
        source: "youtube",
        url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
        coverUrl: "",
      },
      {
        title: "Acoustic Night — камерный состав",
        desc: "Тихий концерт с акустическими барабанами и перкуссией",
        tags: ["Live", "Acoustic"],
        source: "youtube",
        url: "https://www.youtube.com/watch?v=ktvTqknDobU",
        coverUrl: "",
      },
      {
        title: "Session Recap — indie EP",
        desc: "Короткий дневник студийных дней: микрофоны, фазы, живые дубли",
        tags: ["Studio", "Session"],
        source: "youtube",
        url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
        coverUrl: "",
      },
      {
        title: "VK: Drum Lesson (demo)",
        desc: "Пример ролика из VK (вставка через video_ext)",
        tags: ["VK", "Demo"],
        source: "vk",
        url: "https://vk.com/video_ext.php?oid=150747387&id=456239116&hd=2&hash=e90bf75a169f4c5b",
        coverUrl: "",
      },
      {
        title: "Drum Cover — «Neon Tracks»",
        desc: "Камерный кавер популярного трека: двойной бас, фильтры, клип-монтаж",
        tags: ["Cover", "Video"],
        source: "youtube",
        url: "https://www.youtube.com/watch?v=RgKAFK5djSk",
        coverUrl: "",
      },
      {
        title: "Private Lesson Highlights",
        desc: "Фрагменты уроков: постановка рук, клик, чтение партитур",
        tags: ["Teaching", "Lesson"],
        source: "youtube",
        url: "https://www.youtube.com/watch?v=hTWKbfoikeg",
        coverUrl: "",
      },
    ],
  },
  experience: {
    eyebrow: "Опыт",
    heading: "Избранные проекты и сцены",
    items: [
      { y: "2024", t: "Тур с поп-исполнителем", d: "32 концерта по России и СНГ" },
      { y: "2023", t: "Запись альбома «Северный ветер»", d: "Сессионный ударник, 11 треков" },
      { y: "2022", t: "Джаз-фестиваль «Усадьба Jazz»", d: "Выступление в составе квинтета" },
      { y: "2021", t: "Преподавательская практика", d: "Школа барабанов, 40+ учеников" },
      { y: "2019", t: "Саундтрек к короткометражке", d: "Барабаны, перкуссия, аранжировка" },
    ],
  },
  contact: {
    eyebrow: "Контакты",
    heading: "Давайте сыграем вместе",
    description:
      "Студийная сессия, выступление с вашим коллективом или первый урок — напишите, обсудим формат и сроки",
    email: "hello@amelin-drums.ru",
    phone: "+7 (999) 123-45-67",
    socials: [
      { label: "Telegram", url: "https://t.me/amelindrums" },
      { label: "Instagram", url: "https://instagram.com/amelindrums" },
      { label: "VK", url: "https://vk.com/amelindrums" },
    ],
  },
};

/** Strip legacy fields and fill gaps from defaults (e.g. old hero.eyebrow in CMS). */
export function normalizeSiteContent(raw: unknown): SiteContent {
  const incoming = (raw && typeof raw === "object" ? raw : {}) as Partial<SiteContent> & {
    hero?: Partial<SiteContent["hero"]> & { eyebrow?: unknown };
  };

  const { eyebrow: _legacyHeroEyebrow, ...heroRest } = {
    ...DEFAULT_CONTENT.hero,
    ...(incoming.hero ?? {}),
  };

  const merged: SiteContent = {
    ...DEFAULT_CONTENT,
    ...incoming,
    hero: { ...DEFAULT_CONTENT.hero, ...heroRest },
    marquee: incoming.marquee ?? DEFAULT_CONTENT.marquee,
    about: {
      ...DEFAULT_CONTENT.about,
      ...incoming.about,
      imageUrl: (() => {
        const value =
          typeof incoming.about?.imageUrl === "string" ? incoming.about.imageUrl.trim() : "";
        return value || DEFAULT_CONTENT.about.imageUrl;
      })(),
    },
    services: (() => {
      const { subtitle: _legacyServicesSubtitle, ...servicesRest } = {
        ...DEFAULT_CONTENT.services,
        ...(incoming.services ?? {}),
      } as SiteContent["services"] & { subtitle?: unknown };
      return { ...DEFAULT_CONTENT.services, ...servicesRest };
    })(),
    portfolio: (() => {
      const { subtitle: _legacyPortfolioSubtitle, ...portfolioRest } = {
        ...DEFAULT_CONTENT.portfolio,
        ...(incoming.portfolio ?? {}),
      } as SiteContent["portfolio"] & { subtitle?: unknown };
      return {
        ...DEFAULT_CONTENT.portfolio,
        ...portfolioRest,
        // Pad shorter CMS lists with default example videos so admin/landing stay filled.
        videos: padPortfolioVideos(normalizePortfolioVideos(incoming.portfolio?.videos)),
      };
    })(),
    experience: { ...DEFAULT_CONTENT.experience, ...incoming.experience },
    contact: {
      ...DEFAULT_CONTENT.contact,
      ...incoming.contact,
      socials: normalizeContactSocials(incoming.contact?.socials),
    },
  };

  return polishSiteContent(merged);
}

/** Titles without trailing periods; last sentence of body without a period; «и» + nbsp. */
function polishSiteContent(content: SiteContent): SiteContent {
  return {
    ...content,
    hero: {
      ...content.hero,
      description: polishBody(content.hero.description),
    },
    about: {
      ...content.about,
      heading: polishTitle(content.about.heading),
      paragraphs: content.about.paragraphs.map(polishBody),
    },
    services: {
      ...content.services,
      heading: polishTitle(content.services.heading),
      items: content.services.items.map((item) => ({
        ...item,
        t: polishTitle(item.t),
        d: polishBody(item.d),
      })),
    },
    portfolio: {
      ...content.portfolio,
      heading: polishTitle(content.portfolio.heading),
      videos: content.portfolio.videos.map((video) => ({
        ...video,
        title: polishTitle(video.title),
        desc: polishBody(video.desc),
      })),
    },
    experience: {
      ...content.experience,
      heading: polishTitle(content.experience.heading),
      items: content.experience.items.map((item) => ({
        ...item,
        t: polishTitle(item.t),
        d: polishBody(item.d),
      })),
    },
    contact: {
      ...content.contact,
      heading: polishTitle(content.contact.heading),
      description: polishBody(content.contact.description),
    },
  };
}

function normalizePortfolioVideos(incoming?: unknown): PortfolioVideo[] | undefined {
  if (!Array.isArray(incoming)) return undefined;
  return incoming
    .map((v) => {
      if (!v || typeof v !== "object") return null;
      const raw = v as Record<string, unknown>;
      const title = typeof raw.title === "string" ? raw.title : "";
      const desc = typeof raw.desc === "string" ? raw.desc : "";
      const tags = Array.isArray(raw.tags)
        ? raw.tags.filter((t: unknown): t is string => typeof t === "string")
        : [];

      // New format
      if (
        (raw.source === "youtube" || raw.source === "vk" || raw.source === "file") &&
        typeof raw.url === "string"
      ) {
        return {
          title,
          desc,
          tags,
          source: raw.source,
          url: raw.url,
          coverUrl: typeof raw.coverUrl === "string" ? raw.coverUrl.trim() : "",
        } satisfies PortfolioVideo;
      }

      // Legacy format (CMS/old defaults): youtubeUrl
      if (typeof raw.youtubeUrl === "string") {
        return {
          title,
          desc,
          tags,
          source: "youtube" as const,
          url: raw.youtubeUrl,
          coverUrl: typeof raw.coverUrl === "string" ? raw.coverUrl.trim() : "",
        } satisfies PortfolioVideo;
      }

      return null;
    })
    .filter(Boolean) as PortfolioVideo[];
}

function padPortfolioVideos(incoming?: PortfolioVideo[]): PortfolioVideo[] {
  const defaults = DEFAULT_CONTENT.portfolio.videos;
  if (!incoming?.length) return defaults;
  if (incoming.length >= defaults.length) return incoming;
  return [...incoming, ...defaults.slice(incoming.length)];
}

/** Coerce CMS typos (@handle, "#") into real https URLs or empty (hide). */
function normalizeSocialUrl(label: string, url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return "";

  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1).replace(/^\/+/, "");
    if (!handle) return "";
    const hay = label.toLowerCase();
    if (hay.includes("telegram") || hay === "tg") return `https://t.me/${handle}`;
    if (hay.includes("instagram")) return `https://instagram.com/${handle}`;
    if (hay === "vk" || hay.includes("vkontakte")) return `https://vk.com/${handle}`;
    return "";
  }

  return trimmed;
}

function normalizeContactSocials(
  incoming?: SiteContent["contact"]["socials"],
): SiteContent["contact"]["socials"] {
  const defaults = DEFAULT_CONTENT.contact.socials;
  if (!incoming?.length) return defaults;

  const byLabel = new Map(incoming.map((s) => [s.label.trim().toLowerCase(), s]));

  const core = defaults.map((item) => {
    const match = byLabel.get(item.label.toLowerCase());
    // Empty URL is intentional — hides the network on the site.
    if (match) return { label: item.label, url: normalizeSocialUrl(item.label, match.url) };
    return { ...item };
  });

  const coreLabels = new Set(defaults.map((d) => d.label.toLowerCase()));
  const extras = incoming
    .map((s) => ({
      label: s.label.trim(),
      url: normalizeSocialUrl(s.label, s.url ?? ""),
    }))
    .filter((s) => {
      const label = s.label.toLowerCase();
      if (!label || coreLabels.has(label)) return false;
      return Boolean(s.url);
    });

  return [...core, ...extras];
}

/** Extract YouTube video ID from various URL formats. */
export function getYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Extract YouTube embed URL from various URL formats. */
export function getYoutubeEmbed(url: string): string | null {
  const id = getYoutubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

/** YouTube preview image for carousel cards (hq is widely available). */
export function getYoutubeThumbnail(url: string): string | null {
  const id = getYoutubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/**
 * Resolve carousel cover: custom upload → YouTube auto thumb → fallback asset.
 */
export function resolvePortfolioCover(video: PortfolioVideo, fallback: string): string {
  const custom = video.coverUrl?.trim();
  if (custom) return custom;
  if (video.source === "youtube") {
    const auto = getYoutubeThumbnail(video.url);
    if (auto) return auto;
  }
  return fallback;
}

export function getVkEmbed(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.host.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const isVkHost = host.endsWith("vk.com") || host.endsWith("vkvideo.ru");
    const isEmbedPath = path.endsWith("/video_ext.php");
    if (!isVkHost || !isEmbedPath) return null;
    // Must contain at least oid + id; hash may be required depending on privacy settings.
    const oid = parsed.searchParams.get("oid");
    const id = parsed.searchParams.get("id");
    if (!oid || !id) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function getPortfolioVideoEmbed(video: PortfolioVideo): string | null {
  if (video.source === "file") return null;
  if (video.source === "vk") {
    const embed = getVkEmbed(video.url);
    if (!embed) return null;
    try {
      const parsed = new URL(embed);
      if (!parsed.searchParams.has("autoplay")) parsed.searchParams.set("autoplay", "1");
      return parsed.toString();
    } catch {
      return embed;
    }
  }
  const embed = getYoutubeEmbed(video.url);
  return embed ? `${embed}?autoplay=1` : null;
}
