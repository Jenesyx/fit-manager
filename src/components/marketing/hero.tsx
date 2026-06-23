"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

/**
 * Cinematic hero: the video sits as a fixed full-screen background. It does NOT
 * autoplay — it holds its first frame until the user starts scrolling, then
 * plays softly and loops behind the page content. The page content below scrolls
 * UP over it (the video is z-0 and fixed). Scroll animation is a GPU transform
 * parallax — we never seek `video.currentTime`, which is what caused old jitter.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      // Respect reduced-motion: hold the first frame, no autoplay, no parallax.
      video.pause();
      return;
    }

    // No autoplay: hold the first frame until the user scrolls.
    video.pause();

    const ctx = gsap.context(() => {
      // The hero is a TALL section with a `sticky` stage (see JSX): the headline
      // stays centered over the playing video while the user scrolls through the
      // section, so they watch the full hero before the next section slides up.
      // No ScrollTrigger pin here — pin reparents the DOM node and clashes with
      // React (removeChild NotFoundError). CSS sticky gives the same effect.

      // Play while the hero is on screen; hold the first frame at rest.
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          if (self.progress > 0.001) {
            if (video.paused) void video.play().catch(() => {});
          } else if (!video.paused) {
            video.pause();
          }
        },
      });

      // Video gently settles across the whole hero scroll.
      gsap.fromTo(
        video,
        { scale: 1.12 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        },
      );

      // Headline holds, then drifts up + fades over the LAST viewport of the
      // hero (as the sticky stage releases and the next section comes up).
      gsap.to(contentRef.current, {
        yPercent: -10,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "bottom bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[250vh]">
      {/* Fixed full-screen video — always behind content (z-0) */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-background">
        <video
          ref={videoRef}
          src="/videos/hero-section-video.mp4"
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover will-change-transform"
        />
        {/* Legibility scrim — darker top/bottom so the headline reads cleanly */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-background/80 via-background/35 to-background"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-background/10"
        />
      </div>

      {/* Sticky stage: holds the hero centered over the playing video while the
          user scrolls through the tall section, then releases to the next one. */}
      <div className="sticky top-0 z-10 flex h-svh items-center">
        <div
          ref={contentRef}
          className="mx-auto flex w-full max-w-7xl flex-col items-start justify-center px-6"
        >
          <span className="eyebrow">10 Studios · 5 Städte · Niederrhein</span>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink-strong sm:text-6xl md:text-7xl">
          Stärker werden.
          <br />
          <span className="text-primary">Jeden einzelnen Tag.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-body md:text-xl">
          Über 1.200 Mitglieder trainieren bei Fit·Manager. Moderne Studios,
          40+ Kurse pro Woche und Trainer, die dich wirklich weiterbringen.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="font-semibold">
            <Link href="/registrieren">
              Mitglied werden
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#kurse">Kurse entdecken</Link>
          </Button>
        </div>
        </div>

        {/* Scroll cue */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-8 flex justify-center"
        >
          <ChevronDown className="size-6 animate-bounce text-ink-strong/70" />
        </div>
      </div>
    </section>
  );
}
