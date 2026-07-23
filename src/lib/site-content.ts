import { polishBody, polishLabel, polishTitle } from "@/lib/typography";

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

/**
 * List fields: missing/invalid → defaults; present array (incl. empty/shorter) → keep as-is.
 * Never pad deleted CMS items back from DEFAULT_CONTENT — that broke admin→site sync.
 */
function pickStringList(incoming: unknown, fallback: string[]): string[] {
  if (!Array.isArray(incoming)) return fallback;
  return incoming.filter((item): item is string => typeof item === "string");
}

function pickMappedList<T>(
  incoming: unknown,
  fallback: T[],
  mapItem: (item: unknown) => T | null,
): T[] {
  if (!Array.isArray(incoming)) return fallback;
  return incoming.map(mapItem).filter((item): item is T => item !== null);
}

/** Strip legacy fields and fill gaps from defaults (e.g. old hero.eyebrow in CMS). */
export function normalizeSiteContent(raw: unknown): SiteContent {
  const incoming = (raw && typeof raw === "object" ? raw : {}) as Partial<SiteContent> & {
    hero?: Partial<SiteContent["hero"]> & { eyebrow?: unknown };
    about?: Partial<SiteContent["about"]>;
    services?: Partial<SiteContent["services"]> & { subtitle?: unknown };
    portfolio?: Partial<SiteContent["portfolio"]> & { subtitle?: unknown };
    experience?: Partial<SiteContent["experience"]>;
    contact?: Partial<SiteContent["contact"]>;
  };

  const { eyebrow: _legacyHeroEyebrow, ...heroRest } = {
    ...DEFAULT_CONTENT.hero,
    ...(incoming.hero ?? {}),
  };

  const aboutIn: Partial<SiteContent["about"]> = incoming.about ?? {};
  const { subtitle: _legacyServicesSubtitle, ...servicesRest } = {
    ...(incoming.services ?? {}),
  } as Partial<SiteContent["services"]> & { subtitle?: unknown };
  const servicesIn: Partial<SiteContent["services"]> = servicesRest;
  const { subtitle: _legacyPortfolioSubtitle, ...portfolioRest } = {
    ...(incoming.portfolio ?? {}),
  } as Partial<SiteContent["portfolio"]> & { subtitle?: unknown };
  const portfolioIn: Partial<SiteContent["portfolio"]> = portfolioRest;
  const experienceIn: Partial<SiteContent["experience"]> = incoming.experience ?? {};
  const contactIn: Partial<SiteContent["contact"]> = incoming.contact ?? {};

  const merged: SiteContent = {
    ...DEFAULT_CONTENT,
    ...incoming,
    hero: { ...DEFAULT_CONTENT.hero, ...heroRest },
    marquee: pickStringList(incoming.marquee, DEFAULT_CONTENT.marquee),
    about: {
      ...DEFAULT_CONTENT.about,
      ...aboutIn,
      imageUrl: (() => {
        const value = typeof aboutIn.imageUrl === "string" ? aboutIn.imageUrl.trim() : "";
        return value || DEFAULT_CONTENT.about.imageUrl;
      })(),
      paragraphs: pickStringList(aboutIn.paragraphs, DEFAULT_CONTENT.about.paragraphs),
      stats: pickMappedList(aboutIn.stats, DEFAULT_CONTENT.about.stats, (item) => {
        if (!item || typeof item !== "object") return null;
        const raw = item as Record<string, unknown>;
        return {
          n: typeof raw.n === "string" ? raw.n : "",
          l: typeof raw.l === "string" ? raw.l : "",
        };
      }),
    },
    services: {
      ...DEFAULT_CONTENT.services,
      ...servicesIn,
      items: pickMappedList(servicesIn.items, DEFAULT_CONTENT.services.items, (item) => {
        if (!item || typeof item !== "object") return null;
        const raw = item as Record<string, unknown>;
        return {
          n: typeof raw.n === "string" ? raw.n : "",
          t: typeof raw.t === "string" ? raw.t : "",
          d: typeof raw.d === "string" ? raw.d : "",
          tags: pickStringList(raw.tags, []),
        };
      }),
    },
    portfolio: {
      ...DEFAULT_CONTENT.portfolio,
      ...portfolioIn,
      videos: pickMappedList(
        portfolioIn.videos,
        DEFAULT_CONTENT.portfolio.videos,
        (item) => normalizePortfolioVideo(item),
      ),
    },
    experience: {
      ...DEFAULT_CONTENT.experience,
      ...experienceIn,
      items: pickMappedList(experienceIn.items, DEFAULT_CONTENT.experience.items, (item) => {
        if (!item || typeof item !== "object") return null;
        const raw = item as Record<string, unknown>;
        return {
          y: typeof raw.y === "string" ? raw.y : "",
          t: typeof raw.t === "string" ? raw.t : "",
          d: typeof raw.d === "string" ? raw.d : "",
        };
      }),
    },
    contact: {
      ...DEFAULT_CONTENT.contact,
      ...contactIn,
      socials: normalizeContactSocials(contactIn.socials),
    },
  };

  return applySiteTypography(merged);
}

/**
 * Apply Russian typography to all CMS text fields (hanging prepositions → nbsp,
 * trailing periods stripped on titles/body). Called on every load/save of site content.
 */
export function applySiteTypography(content: SiteContent): SiteContent {
  return {
    ...content,
    hero: {
      ...content.hero,
      name1: polishLabel(content.hero.name1),
      name2: polishLabel(content.hero.name2),
      description: polishBody(content.hero.description),
      ctaPrimary: polishLabel(content.hero.ctaPrimary),
      ctaSecondary: polishLabel(content.hero.ctaSecondary),
    },
    marquee: content.marquee.map(polishLabel),
    about: {
      ...content.about,
      eyebrow: polishLabel(content.about.eyebrow),
      heading: polishTitle(content.about.heading),
      paragraphs: content.about.paragraphs.map(polishBody),
      stats: content.about.stats.map((stat) => ({
        ...stat,
        l: polishLabel(stat.l),
      })),
    },
    services: {
      ...content.services,
      eyebrow: polishLabel(content.services.eyebrow),
      heading: polishTitle(content.services.heading),
      items: content.services.items.map((item) => ({
        ...item,
        t: polishTitle(item.t),
        d: polishBody(item.d),
        tags: item.tags.map(polishLabel),
      })),
    },
    portfolio: {
      ...content.portfolio,
      eyebrow: polishLabel(content.portfolio.eyebrow),
      heading: polishTitle(content.portfolio.heading),
      videos: content.portfolio.videos.map((video) => ({
        ...video,
        title: polishTitle(video.title),
        desc: polishBody(video.desc),
        tags: video.tags.map(polishLabel),
      })),
    },
    experience: {
      ...content.experience,
      eyebrow: polishLabel(content.experience.eyebrow),
      heading: polishTitle(content.experience.heading),
      items: content.experience.items.map((item) => ({
        ...item,
        t: polishTitle(item.t),
        d: polishBody(item.d),
      })),
    },
    contact: {
      ...content.contact,
      eyebrow: polishLabel(content.contact.eyebrow),
      heading: polishTitle(content.contact.heading),
      description: polishBody(content.contact.description),
      socials: content.contact.socials.map((social) => ({
        ...social,
        label: polishLabel(social.label),
      })),
    },
  };
}

function normalizePortfolioVideo(v: unknown): PortfolioVideo | null {
  if (!v || typeof v !== "object") return null;
  const raw = v as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title : "";
  const desc = typeof raw.desc === "string" ? raw.desc : "";
  const tags = pickStringList(raw.tags, []);

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
      url: raw.url.trim(),
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
}

/** Coerce CMS typos (@handle, "#") into real https URLs or empty (hide). */
export function normalizeSocialUrl(label: string, url: string): string {
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

function normalizeContactSocials(incoming?: unknown): SiteContent["contact"]["socials"] {
  // Same contract as other lists: missing → defaults; [] / shorter → exact CMS list.
  // Empty URL is intentional — SocialLinks hides that network on the site.
  return pickMappedList(incoming, DEFAULT_CONTENT.contact.socials, (item) => {
    if (!item || typeof item !== "object") return null;
    const raw = item as Record<string, unknown>;
    const label = typeof raw.label === "string" ? raw.label.trim() : "";
    if (!label) return null;
    const url = normalizeSocialUrl(label, typeof raw.url === "string" ? raw.url : "");
    return { label, url };
  });
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

/** Canonical watch URL for “open on YouTube” fallback when embed is blocked. */
export function getYoutubeWatchUrl(url: string): string | null {
  const id = getYoutubeVideoId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

/**
 * Build an embed URL YouTube is more likely to accept for anonymous viewers.
 * Requires a valid Referer/origin (see iframe referrerPolicy + site meta referrer).
 */
export function buildYoutubeEmbedSrc(
  url: string,
  options?: { autoplay?: boolean; origin?: string },
): string | null {
  const base = getYoutubeEmbed(url);
  if (!base) return null;

  const params = new URLSearchParams({
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });
  if (options?.autoplay) params.set("autoplay", "1");

  const origin =
    options?.origin ??
    (typeof window !== "undefined" ? window.location.origin : undefined);
  if (origin?.startsWith("http")) params.set("origin", origin);

  return `${base}?${params.toString()}`;
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
  return buildYoutubeEmbedSrc(video.url, { autoplay: true });
}
