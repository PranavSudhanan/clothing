"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn, imageUrl } from "@/lib/utils";
import { SmartLink } from "./ui";

export type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  mobileImage: string;
  ctaLabel: string;
  ctaHref: string;
  cta2Label: string;
  cta2Href: string;
  align: "left" | "center" | "right";
  overlay: number;
};

const HEIGHTS: Record<string, string> = {
  screen: "min-h-[calc(100svh-6.75rem)]",
  large: "min-h-[34rem] md:min-h-[44rem]",
  medium: "min-h-[26rem] md:min-h-[32rem]",
  small: "min-h-[18rem] md:min-h-[22rem]",
};

export function HeroSlider({ slides, height, interval }: { slides: Slide[]; height: string; interval: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex((next + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || interval <= 0 || paused) return;
    const timer = window.setTimeout(() => go(index + 1), interval * 1000);
    return () => window.clearTimeout(timer);
  }, [index, count, interval, paused, go]);

  if (count === 0) return null;

  return (
    <div
      className={cn("relative isolate overflow-hidden bg-[#141414]", HEIGHTS[height] ?? HEIGHTS.large)}
      data-tone="image"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {slides.map((slide, i) => {
        const active = i === index;
        const alignment = {
          left: "items-start text-left",
          center: "items-center text-center mx-auto",
          right: "items-end text-right ml-auto",
        }[slide.align];
        return (
          <div
            key={slide.id}
            aria-hidden={!active}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
            )}
          >
            {slide.image && (
              <picture>
                {slide.mobileImage && <source media="(max-width: 767px)" srcSet={imageUrl(slide.mobileImage, 900)} />}
                <img
                  src={imageUrl(slide.image, 1920)}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover object-[center_25%] transition-transform duration-[7000ms] ease-out",
                    active ? "scale-100" : "scale-105",
                  )}
                />
              </picture>
            )}
            <div className="absolute inset-0" style={{ background: `rgb(0 0 0 / ${Math.min(Math.max(slide.overlay, 0), 90) / 100})` }} />
            <div className="container-page relative flex h-full items-center py-16">
              <div key={active ? `on-${index}` : "off"} className={cn("flex max-w-2xl flex-col", alignment, active && "animate-fade-up")}>
                {slide.eyebrow && <p className="eyebrow mb-5">{slide.eyebrow}</p>}
                {i === 0 ? (
                  <h1 className="text-[2.6rem] leading-[1.02] md:text-7xl">{slide.title}</h1>
                ) : (
                  <h2 className="text-[2.6rem] leading-[1.02] md:text-7xl">{slide.title}</h2>
                )}
                {slide.subtitle && <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">{slide.subtitle}</p>}
                {(slide.ctaLabel || slide.cta2Label) && (
                  <div className="mt-9 flex flex-wrap gap-3">
                    {slide.ctaLabel && (
                      <SmartLink href={slide.ctaHref} className="btn btn-primary" tabIndex={active ? 0 : -1}>
                        {slide.ctaLabel}
                      </SmartLink>
                    )}
                    {slide.cta2Label && (
                      <SmartLink href={slide.cta2Href} className="btn btn-outline" tabIndex={active ? 0 : -1}>
                        {slide.cta2Label}
                      </SmartLink>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-2.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={cn("h-0.5 transition-all duration-500", i === index ? "w-10 bg-white" : "w-5 bg-white/45 hover:bg-white/70")}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-black md:flex"
          >
            <ChevronLeft size={20} strokeWidth={1.4} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-black md:flex"
          >
            <ChevronRight size={20} strokeWidth={1.4} />
          </button>
        </>
      )}
    </div>
  );
}
