"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { motion } from "motion/react";

type AnimationPhase = "idle" | "sliding" | "spinning" | "expanding" | "done";

export default function LandingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<AnimationPhase>("idle");

  const handleEnter = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("sliding");
  }, [phase]);

  const isAnimating = phase !== "idle";

  // Shared fade-out transition
  const fadeOut = {
    animate: isAnimating
      ? { opacity: 0, y: 20 }
      : { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" as const },
  };

  return (
    <div className="bg-[url('/assets/landing/background.png')] bg-top bg-cover text-[var(--text-primary)] max-w-lg mx-auto overflow-hidden">
      <main className="mx-auto grid min-h-dvh grid-rows-[auto_1fr_auto_auto] px-6 py-6 relative">
        {/* Message box */}
        <motion.div
          className="flex items-center justify-center"
          animate={isAnimating ? { opacity: 0, y: -40 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
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
        </motion.div>

        {/* Album area: poster + CD */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            {/* CD (behind poster) — spinning + scaling */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center"
              animate={{
                opacity: isAnimating ? 1 : 0,
                zIndex:
                  phase === "spinning" || phase === "expanding" || phase === "done"
                    ? 60
                    : 1,
              }}
              transition={{ opacity: { duration: 0.4, ease: "easeOut" } }}
              style={{ pointerEvents: isAnimating ? "auto" : "none" }}
            >
              {/* Outer wrapper: handles scale */}
              <motion.div
                animate={{
                  scale:
                    phase === "expanding" || phase === "done" ? 20 : 1,
                }}
                transition={{
                  duration: 2.5,
                  ease: [0.4, 0, 1, 1], // easeIn curve
                }}
                onAnimationComplete={() => {
                  if (phase === "expanding") {
                    setPhase("done");
                    router.push("/game");
                  }
                }}
              >
                {/* Inner wrapper: handles spin */}
                <motion.div
                  animate={
                    isAnimating
                      ? { rotate: 360 }
                      : { rotate: 0 }
                  }
                  transition={
                    isAnimating
                      ? {
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }
                      : { duration: 0 }
                  }
                >
                  <Image
                    src="/assets/landing/album-cd.svg"
                    alt="唱片"
                    width={280}
                    height={280}
                    priority
                    className="rounded-full"
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Poster (slides right on click) */}
            <motion.div
              className="relative"
              style={{ zIndex: 2 }}
              animate={
                isAnimating
                  ? {
                      x: "120%",
                      rotate: 6,
                      opacity: phase === "expanding" || phase === "done" ? 0 : 1,
                    }
                  : { x: 0, rotate: 0, opacity: 1 }
              }
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 22,
                opacity: { duration: 0.3, ease: "easeOut" },
              }}
              onAnimationComplete={() => {
                if (phase === "sliding") {
                  setPhase("spinning");
                  // Let CD spin for ~1.2s then expand
                  setTimeout(() => setPhase("expanding"), 1200);
                }
              }}
            >
              <Image
                src="/assets/landing/album-poster.png"
                alt="SITCON 大地遊戲"
                width={320}
                height={460}
                priority
              />
            </motion.div>
          </div>

          {/* Player controls — fade out */}
          <motion.div
            className="flex flex-col items-center gap-4"
            {...fadeOut}
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
          </motion.div>
        </div>

        {/* Enter button */}
        <motion.div
          className="mt-8 flex items-center justify-center"
          {...fadeOut}
        >
          <button onClick={handleEnter} className="block cursor-pointer">
            <Image
              src="/assets/landing/enter.png"
              alt="進入遊戲"
              width={180}
              height={64}
            />
          </button>
        </motion.div>

        {/* Bottom decorations */}
        <motion.div
          className="grid grid-cols-[auto_1fr] items-end gap-3"
          {...fadeOut}
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
        </motion.div>
      </main>
    </div>
  );
}
