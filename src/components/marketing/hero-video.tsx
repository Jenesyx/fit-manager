"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HeroVideo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      gsap.set(wrap, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    // initial hidden state
    gsap.set(wrap, { opacity: 0, y: 80, scale: 0.94 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: "top 84%",
          end: "top 40%",
          toggleActions: "play none none reverse",
          onEnter: () => void video.play().catch(() => {}),
          onLeaveBack: () => video.pause(),
        },
      });

      tl.to(wrap, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.3,
        ease: "power4.out",
      });
    }, wrapRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 lg:pb-28">
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-2xl border border-hairline/60"
        style={{
          boxShadow:
            "0 0 120px -24px color-mix(in oklab, var(--color-primary) 25%, transparent), 0 32px 64px -16px rgba(0,0,0,0.5)",
        }}
      >
        {/* hairline green top-accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        />

        {/* bottom fade so the video dissolves into the page */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-background/90 to-transparent"
        />

        <video
          ref={videoRef}
          src="/videos/hero-section-video.mp4"
          muted
          playsInline
          loop
          preload="metadata"
          className="aspect-video w-full object-cover"
        />
      </div>
    </div>
  );
}
