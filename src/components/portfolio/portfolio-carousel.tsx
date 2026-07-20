import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import { resolvePortfolioCover, type PortfolioVideo } from "@/lib/site-content";
import { cn } from "@/lib/utils";

type PortfolioCarouselProps = {
  videos: PortfolioVideo[];
  thumbs: string[];
  onSelect: (index: number) => void;
  className?: string;
};

export function PortfolioCarousel({ videos, thumbs, onSelect, className }: PortfolioCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!api) return;

    const sync = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setScrollSnaps(api.scrollSnapList());
    };

    sync();
    api.on("select", sync);
    api.on("reInit", sync);

    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  if (videos.length === 0) return null;

  return (
    <div className={cn("portfolio-carousel relative", className)}>
      <Carousel
        opts={{
          align: "start",
          loop: false,
          dragFree: false,
          containScroll: "trimSnaps",
        }}
        setApi={setApi}
        className="w-full"
      >
        {/*
          Per-card reveal is off on purpose: ScrollTrigger only animates slides
          that are on-screen at trigger time; the rest stay opacity-0 and look
          like empty gaps when the carousel is scrolled.
        */}
        <CarouselContent className="-ml-5" viewportClassName="portfolio-carousel__viewport">
          {videos.map((video, index) => (
            <CarouselItem
              key={`${video.title}-${index}`}
              className="basis-[86%] pl-5 sm:basis-[55%] md:basis-1/2 lg:basis-1/3"
            >
              <div className="portfolio-carousel__slide">
                <PortfolioCard
                  video={video}
                  thumbSrc={resolvePortfolioCover(video, thumbs[index % thumbs.length])}
                  onOpen={() => onSelect(index)}
                  reveal={false}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="mt-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="tablist" aria-label="Слайды портфолио">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === selectedIndex}
                aria-label={`Слайд ${index + 1}`}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "cursor-pointer rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  index === selectedIndex
                    ? "h-1.5 w-7 bg-primary"
                    : "h-1.5 w-1.5 bg-border hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <CarouselPrevious
              variant="outline"
              className="static size-10 translate-x-0 translate-y-0 rounded-full border-border/80 bg-card text-foreground shadow-none hover:border-primary/40 hover:bg-secondary disabled:opacity-35"
            />
            <CarouselNext
              variant="outline"
              className="static size-10 translate-x-0 translate-y-0 rounded-full border-border/80 bg-card text-foreground shadow-none hover:border-primary/40 hover:bg-secondary disabled:opacity-35"
            />
          </div>
        </div>
      </Carousel>
    </div>
  );
}
