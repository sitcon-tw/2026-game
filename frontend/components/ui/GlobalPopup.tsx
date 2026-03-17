"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePopupStore } from "@/stores";

export default function GlobalPopup() {
  const router = useRouter();
  const popups = usePopupStore((s) => s.popups);
  const dismissPopup = usePopupStore((s) => s.dismissPopup);

  const current = popups[0] ?? null;

  const handleCta = () => {
    if (!current?.cta) return;
    const { link } = current.cta;
    if (link.startsWith("/")) {
      router.push(link);
    } else {
      window.open(link, "_blank");
    }
    dismissPopup(current.id);
  };

  const handleDone = () => {
    if (!current) return;
    dismissPopup(current.id);
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[var(--bg-primary)] shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Image */}
            {current.image && (
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={current.image}
                  alt={current.title}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {/* Content */}
            <div className="space-y-3 p-6">
              <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                {current.title}
              </h2>
              {current.description && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {current.description}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="space-y-3 px-6 pb-6">
              {current.cta && (
                <button
                  onClick={handleCta}
                  className="w-full rounded-full bg-[var(--accent-gold)] py-3 text-base font-bold tracking-widest text-white shadow-md transition-transform active:scale-95"
                >
                  {current.cta.name}
                </button>
              )}
              <button
                onClick={handleDone}
                className="w-full rounded-full bg-[var(--bg-header)] py-3 text-base font-bold tracking-widest text-[var(--text-light)] shadow-md transition-transform active:scale-95"
              >
                {current.doneText ?? "關閉"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
