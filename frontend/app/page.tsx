"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

type AnimationPhase = "idle" | "sliding" | "spinning" | "expanding" | "done";

export default function LandingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<AnimationPhase>("idle");

  const handleEnter = useCallback(() => {
    if (phase !== "idle") return;

    // Step 2: poster slides right, CD revealed & spinning
    setPhase("sliding");

    // CD fully visible, spin for 1s
    setTimeout(() => {
      setPhase("spinning");
    }, 600);

    // Step 3: after 1s of spinning, start expanding
    setTimeout(() => {
      setPhase("expanding");
    }, 1600);

    // Navigate after expand finishes (~3s)
    setTimeout(() => {
      setPhase("done");
      router.push("/levels");
    }, 4600);
  }, [phase, router]);

  const isAnimating = phase !== "idle";

  return (
    <div className="bg-[url('/assets/landing/background.png')] bg-top bg-cover text-[var(--text-primary)] max-w-lg mx-auto overflow-hidden">
      <main className="mx-auto grid min-h-dvh grid-rows-[auto_1fr_auto_auto] px-6 py-6 relative">
        {/* Message box */}
        <div
          className="flex items-center justify-center"
          style={{
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? "translateY(-40px)" : "translateY(0)",
            transition: "opacity 0.5s linear, transform 0.5s linear",
          }}
        >
          <div className="relative w-full max-w-[500px]">
            <Image
              src="/assets/landing/message.png"
              alt="訊息框"
              width={500}
              height={90}
              priority
              className="h-auto w-full"
            />
            <div className="pointer-events-none absolute inset-y-0 left-20 md:left-26 right-6 flex items-center translate-y-[-4px] md:translate-y-[-8px]">
              <div className="h-8 w-full whitespace-nowrap text-[clamp(0.875rem,2.8vw,1.125rem)]">
                點選「開始」進入遊戲👇👇
              </div>
            </div>
          </div>
        </div>

        {/* Album area: poster + CD */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            {/* CD (behind poster) — spinning + scaling */}
            <div
              className="fixed inset-0 flex items-center justify-center"
              style={{
                zIndex:
                  phase === "spinning" || phase === "expanding" || phase === "done" ? 60 : 1,
                opacity: isAnimating ? 1 : 0,
                transition: "opacity 0.4s linear",
                pointerEvents: isAnimating ? "auto" : "none",
              }}
            >
              {/* Outer wrapper: handles scale */}
              <div
                style={{
                  transform:
                    phase === "expanding" || phase === "done"
                      ? "scale(20)"
                      : "scale(1)",
                  transition:
                    phase === "expanding" || phase === "done"
                      ? "transform 3s linear"
                      : "none",
                }}
              >
                {/* Inner wrapper: handles spin */}
                <div
                  style={{
                    animation: isAnimating
                      ? "spin 2.5s linear infinite"
                      : "none",
                  }}
                >
                  <Image
                    src="/assets/landing/album-cd.png"
                    alt="唱片"
                    width={280}
                    height={280}
                    priority
                    className="rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Poster (slides right on click) */}
            <div
              className="relative"
              style={{
                zIndex: 2,
                transform: isAnimating
                  ? "translateX(120%) rotate(6deg)"
                  : "translateX(0) rotate(0deg)",
                opacity: phase === "expanding" || phase === "done" ? 0 : 1,
                transition: "transform 0.6s linear, opacity 0.3s linear",
              }}
            >
              <Image
                src="/assets/landing/album-poster.png"
                alt="SITCON 大地遊戲"
                width={320}
                height={460}
                priority
              />
            </div>
          </div>

          {/* Player controls — fade out */}
          <div
            className="flex flex-col items-center gap-4"
            style={{
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? "translateY(20px)" : "translateY(0)",
              transition: "opacity 0.4s linear, transform 0.4s linear",
            }}
          >
            <Image
              src="/assets/landing/player-controller.png"
              alt="Player controller"
              width={240}
              height={40}
            />
            <Image
              src="/assets/landing/player-timeline.png"
              alt="Player timeline"
              width={320}
              height={44}
            />
          </div>
        </div>

        {/* Enter button */}
        <div
          className="mt-8 flex items-center justify-center"
          style={{
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? "translateY(30px)" : "translateY(0)",
            transition: "opacity 0.4s linear, transform 0.4s linear",
          }}
        >
          <button onClick={handleEnter} className="block cursor-pointer">
            <Image
              src="/assets/landing/enter.png"
              alt="進入遊戲"
              width={180}
              height={64}
            />
          </button>
        </div>

        {/* Bottom decorations */}
        <div
          className="grid grid-cols-[auto_1fr] items-end gap-3"
          style={{
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? "translateY(30px)" : "translateY(0)",
            transition: "opacity 0.4s linear, transform 0.4s linear",
          }}
        >
          <Image
            src="/assets/landing/note.png"
            alt="音符"
            width={48}
            height={60}
          />
          <div className="flex justify-end">
            <Image
              src="/assets/landing/stars.png"
              alt="Stars"
              width={140}
              height={60}
            />
          </div>
        </div>


      </main>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

      `}</style>
    </div>
  );
}
