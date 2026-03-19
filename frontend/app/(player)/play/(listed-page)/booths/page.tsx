"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useActivityStats } from "@/hooks/api";
import type { ActivityWithStatus } from "@/types/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";

export default function BoothsPage() {
  const { data: activities, isLoading } = useActivityStats();
  const [selectedBooth, setSelectedBooth] = useState<ActivityWithStatus | null>(
    null,
  );

  const booths = useMemo(
    () => (activities ?? []).filter((a) => a.type === "booth"),
    [activities],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-[var(--bg-primary)] px-6 py-6">
      {/* Title */}
      <h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center mb-6">
        可解鎖攤位
      </h1>

      {/* Booth Grid — 2 columns × N rows */}
      <div className="grid grid-cols-2 gap-3">
        {booths.map((booth) => (
          <button
            key={booth.id}
            type="button"
            onClick={() => setSelectedBooth(booth)}
            className={`
              flex items-center justify-center px-4 py-5
              font-serif text-xl font-semibold tracking-wide transition-all cursor-pointer
              ${booth.visited
                ? "bg-[var(--accent-bronze)] text-white"
                : "bg-[#C6A97B] text-[var(--text-light)] opacity-70"
              }
            `}
          >
            {booth.name}
          </button>
        ))}
      </div>

      {/* Booth Detail Modal */}
      <Modal
        open={!!selectedBooth}
        onClose={() => setSelectedBooth(null)}
      >
        {selectedBooth && (
          <>
            <h2 className="text-center font-serif text-2xl font-bold text-[var(--text-primary)] mb-2">
              {selectedBooth.name}
            </h2>
            <p className="text-center text-sm text-[var(--text-secondary)] mb-6">
              {selectedBooth.visited ? "已打卡 ✅" : "尚未到訪 🕐"}
            </p>
            <div className="relative mx-auto mb-6 aspect-[4/3] w-full overflow-hidden rounded-lg">
              <Image
                src="/assets/booths/example-map.png"
                alt={`${selectedBooth.name} 地圖`}
                fill
                className="object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedBooth(null)}
              className="w-full rounded-full bg-[var(--bg-header)] px-4 py-2.5 text-sm font-semibold text-[var(--text-light)]"
            >
              關閉
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
