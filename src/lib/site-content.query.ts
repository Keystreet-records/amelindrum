import { queryOptions } from "@tanstack/react-query";
import { getPublicSiteContent } from "@/lib/site-content.functions";
import type { SiteContent } from "@/lib/site-content";

export const SITE_CONTENT_QUERY_KEY = ["site_content"] as const;

export const siteContentQueryOptions = () =>
  queryOptions({
    queryKey: SITE_CONTENT_QUERY_KEY,
    queryFn: (): Promise<SiteContent> => getPublicSiteContent(),
    staleTime: 60_000,
  });
