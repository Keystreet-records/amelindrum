import { useState } from "react";
import { PortfolioCarousel } from "@/components/portfolio/portfolio-carousel";
import { PortfolioVideoModal } from "@/components/portfolio/portfolio-video-modal";
import type { SiteContent } from "@/lib/site-content";

type PortfolioSectionProps = {
  content: SiteContent["portfolio"];
  thumbs: string[];
};

export function PortfolioSection({ content, thumbs }: PortfolioSectionProps) {
  const [active, setActive] = useState<number | null>(null);
  const videos = content.videos;
  const activeVideo = active !== null ? (videos[active] ?? null) : null;

  return (
    <section id="portfolio" className="section-continue section-band-continue">
      <div className="mx-auto max-w-7xl px-6">
        <div className="section-header max-w-2xl">
          <p
            data-reveal="section"
            className="eyebrow text-sm uppercase tracking-[0.35em] text-primary"
          >
            {content.eyebrow}
          </p>
          <h2
            data-reveal="section"
            className="max-w-2xl font-display text-4xl leading-tight md:text-5xl lg:text-6xl"
          >
            {content.heading}
          </h2>
        </div>

        <PortfolioCarousel videos={videos} thumbs={thumbs} onSelect={setActive} />
      </div>

      <PortfolioVideoModal video={activeVideo} onClose={() => setActive(null)} />
    </section>
  );
}
