import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { safeUrlSchema } from "@/lib/safe-url";
import { DEFAULT_CONTENT, normalizeSiteContent, type SiteContent } from "@/lib/site-content";

const text = z.string();
const url = z.string().superRefine((value, ctx) => {
  try {
    safeUrlSchema(value);
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: error instanceof Error ? error.message : "Недопустимая ссылка",
    });
  }
});

const siteContentSchema = z.object({
  hero: z.object({
    name1: text,
    name2: text,
    description: text,
    ctaPrimary: text,
    ctaSecondary: text,
  }),
  marquee: z.array(text),
  about: z.object({
    eyebrow: text,
    heading: text,
    imageUrl: z.string().superRefine((value, ctx) => {
      if (!value.trim()) return;
      try {
        safeUrlSchema(value);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof Error ? error.message : "Недопустимая ссылка на фото",
        });
      }
    }),
    paragraphs: z.array(text),
    stats: z.array(z.object({ n: text, l: text })),
  }),
  services: z.object({
    eyebrow: text,
    heading: text,
    items: z.array(z.object({ n: text, t: text, d: text, tags: z.array(text) })),
  }),
  portfolio: z.object({
    eyebrow: text,
    heading: text,
    videos: z.array(
      z.object({
        title: text,
        desc: text,
        tags: z.array(text),
        source: z.enum(["youtube", "vk", "file"]),
        url: z.string().superRefine((value, ctx) => {
          const trimmed = value.trim();
          if (!trimmed) return;
          // File uploads must be https Blob/CDN URLs; youtube/vk validated loosely as http(s).
          try {
            safeUrlSchema(trimmed);
          } catch (error) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: error instanceof Error ? error.message : "Недопустимая ссылка на видео",
            });
          }
        }),
        coverUrl: z.string().superRefine((value, ctx) => {
          if (!value.trim()) return;
          try {
            safeUrlSchema(value);
          } catch (error) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: error instanceof Error ? error.message : "Недопустимая ссылка на обложку",
            });
          }
        }),
      }),
    ),
  }),
  experience: z.object({
    eyebrow: text,
    heading: text,
    items: z.array(z.object({ y: text, t: text, d: text })),
  }),
  contact: z.object({
    eyebrow: text,
    heading: text,
    description: text,
    email: text,
    phone: text,
    socials: z.array(z.object({ label: text, url })),
  }),
});

function createPublicSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing Supabase environment variables for public content fetch");
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getPublicSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("data")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;
    return normalizeSiteContent(data?.data ?? DEFAULT_CONTENT);
  } catch (error) {
    console.error("[site-content] public fetch failed, using defaults:", error);
    return normalizeSiteContent(DEFAULT_CONTENT);
  }
});

export const getAdminSiteContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) throw roleError;
    if (!role) return { isAdmin: false, content: null };

    const { data, error } = await context.supabase
      .from("site_content")
      .select("data")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    // Always typography-fix on admin load (hanging prepositions, periods).
    return {
      isAdmin: true,
      content: normalizeSiteContent(data?.data ?? DEFAULT_CONTENT),
    };
  });

export const saveAdminSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => siteContentSchema.parse(data) as SiteContent)
  .handler(async ({ data, context }) => {
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) throw roleError;
    if (!role) throw new Error("У этого аккаунта нет прав администратора");

    // Persist already-polished content so the DB stores correct typography.
    const content = normalizeSiteContent(data);

    const { data: savedRow, error } = await context.supabase
      .from("site_content")
      .upsert({ id: 1, data: content, updated_at: new Date().toISOString() }, { onConflict: "id" })
      .select("data")
      .maybeSingle();

    if (error) throw error;
    if (!savedRow?.data) throw new Error("сервер не вернул сохранённый контент");

    return normalizeSiteContent(savedRow.data);
  });
