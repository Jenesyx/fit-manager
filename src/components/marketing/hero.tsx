"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const spacer = spacerRef.current;
    const video = videoRef.current;
    if (!spacer || !video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: gsap.Context | undefined;

    const setup = () => {
      ctx = gsap.context(() => {
        gsap.timeline({
          scrollTrigger: {
            trigger: spacer,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              video.currentTime = self.progress * video.duration;
            },
          },
        }).fromTo(video, { scale: 1.08 }, { scale: 1, ease: "none" });
      });
    };

    if (video.readyState >= 1) {
      setup();
    } else {
      video.addEventListener("loadedmetadata", setup, { once: true });
    }

    return () => ctx?.revert();
  }, []);

  return (
    <>
      {/* Fixed full-screen video — always behind content (z-0) */}
      <div className="fixed inset-0 z-0 bg-background">
        <video
          ref={videoRef}
          src="/videos/hero-section-video.mp4"
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
        />
      </div>

      {/* 500 vh spacer — static in DOM, pushes content div down without waiting for JS */}
      <div ref={spacerRef} className="relative z-2" style={{ height: "500vh" }} />
    </>
  );
}
