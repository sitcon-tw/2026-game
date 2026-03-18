"use client";

import { motion } from "motion/react";
import { Pencil } from "lucide-react";
import LocalQRCode from "@/components/ui/LocalQRCode";

interface MyNamecardCardProps {
  nickname?: string;
  avatar?: string | null;
  currentLevel?: number;
  bio?: string | null;
  email?: string | null;
  links?: string[];
  qrToken?: string | null;
  onEdit: () => void;
  onEnlargeQR: () => void;
}

export default function MyNamecardCard({
  nickname,
  avatar,
  currentLevel,
  bio,
  email,
  links = [],
  qrToken,
  onEdit,
  onEnlargeQR,
}: MyNamecardCardProps) {
  return (
    <motion.div
      className="mt-6 w-full max-w-md rounded-2xl bg-[var(--bg-secondary)] p-5 shadow-sm"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      {/* Profile row: avatar+info left, QR right */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-4">
        <motion.button
          type="button"
          onClick={onEdit}
          className="flex cursor-pointer items-center gap-3 min-w-0 text-left"
          whileTap={{ scale: 0.95 }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={nickname ?? "我"}
              className="h-14 w-14 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-bronze)] text-xl font-bold text-white flex-shrink-0">
              {(nickname ?? "我").charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-serif text-lg font-semibold text-[var(--text-primary)] truncate">
              {nickname ?? "載入中..."}
              <Pencil
                size={12}
                className="ml-1 inline align-middle opacity-50"
              />
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              第 {currentLevel ?? "?"} 關
            </p>
          </div>
        </motion.button>

        {/* QR Code (small, tappable to enlarge) */}
        <motion.button
          type="button"
          onClick={onEnlargeQR}
          className="cursor-pointer rounded-xl bg-white p-1.5 shadow-sm"
          whileTap={{ scale: 0.9 }}
        >
          {qrToken ? (
            <LocalQRCode
              value={qrToken}
              size={64}
              ariaLabel="我的 QR Code"
              className="h-16 w-16 overflow-hidden rounded-md"
            />
          ) : (
            <div className="h-16 w-16 animate-pulse rounded-md bg-[#ccc]" />
          )}
        </motion.button>
      </div>

      {/* Namecard content — each row tappable to edit */}
      <motion.button
        type="button"
        onClick={onEdit}
        className="mt-4 w-full cursor-pointer rounded-xl bg-[var(--bg-primary)] p-4 text-left"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.97 }}
      >
        <p className="text-xs font-semibold text-[var(--text-secondary)]">
          自我介紹
          <Pencil size={12} className="ml-1 inline align-middle opacity-50" />
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
          {bio?.trim() || "尚未填寫"}
        </p>
      </motion.button>

      <motion.button
        type="button"
        onClick={onEdit}
        className="mt-3 w-full cursor-pointer rounded-xl bg-[var(--bg-primary)] p-4 text-left"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        whileTap={{ scale: 0.97 }}
      >
        <p className="text-xs font-semibold text-[var(--text-secondary)]">
          公開 Email
          <Pencil size={12} className="ml-1 inline align-middle opacity-50" />
        </p>
        <p className="mt-1 break-all text-sm text-[var(--text-primary)]">
          {email || "尚未公開"}
        </p>
      </motion.button>

      <motion.button
        type="button"
        onClick={onEdit}
        className="mt-3 w-full cursor-pointer rounded-xl bg-[var(--bg-primary)] p-4 text-left"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.97 }}
      >
        <p className="text-xs font-semibold text-[var(--text-secondary)]">
          連結
          <Pencil size={12} className="ml-1 inline align-middle opacity-50" />
        </p>
        {links.length > 0 ? (
          <div className="mt-1 space-y-1">
            {links.map((link) => (
              <p
                key={link}
                className="break-all text-sm text-[var(--bg-header)] underline"
              >
                {link}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-[var(--text-primary)]">尚未提供</p>
        )}
      </motion.button>
    </motion.div>
  );
}
