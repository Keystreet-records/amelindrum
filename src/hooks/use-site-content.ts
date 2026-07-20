import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CONTENT, normalizeSiteContent, type SiteContent } from "@/lib/site-content";
import { siteContentQueryOptions } from "@/lib/site-content.query";

let liveChannel: RealtimeChannel | null = null;
let liveChannelSubscribers = 0;
let liveChannelBound = false;

function ensureSiteContentLiveChannel(onChange: (data: unknown) => void): () => void {
  liveChannelSubscribers += 1;

  if (!liveChannel) {
    liveChannel = supabase.channel("site-content-live");
  }

  if (!liveChannelBound) {
    liveChannelBound = true;
    liveChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_content", filter: "id=eq.1" },
      (payload) => {
        const nextContent = (payload.new as { data?: unknown } | null)?.data;
        if (nextContent) onChange(nextContent);
      },
    );
    liveChannel.subscribe();
  }

  return () => {
    liveChannelSubscribers = Math.max(0, liveChannelSubscribers - 1);
    if (liveChannelSubscribers === 0 && liveChannel) {
      void supabase.removeChannel(liveChannel);
      liveChannel = null;
      liveChannelBound = false;
    }
  };
}

export function useSiteContent(initialContent?: SiteContent) {
  const queryClient = useQueryClient();
  const query = useQuery({
    ...siteContentQueryOptions(),
    ...(initialContent ? { initialData: initialContent } : {}),
  });

  useEffect(() => {
    return ensureSiteContentLiveChannel((nextContent) => {
      queryClient.setQueryData(
        siteContentQueryOptions().queryKey,
        normalizeSiteContent(nextContent),
      );
      void queryClient.invalidateQueries({ queryKey: siteContentQueryOptions().queryKey });
    });
  }, [queryClient]);

  const raw = query.data ?? initialContent ?? DEFAULT_CONTENT;
  return { content: normalizeSiteContent(raw), isLoading: query.isLoading };
}
