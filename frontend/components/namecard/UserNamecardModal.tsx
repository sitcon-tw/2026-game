"use client";

import type { PublicNamecard } from "@/types/api";

interface UserNamecardModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    nickname: string;
    avatar?: string | null;
    current_level: number;
    namecard?: PublicNamecard;
  } | null;
}

export default function UserNamecardModal({
  open,
  onClose,
  user,
}: UserNamecardModalProps) {
  if (!open || !user) return null;

  const links = user.namecard?.links ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="關閉名牌"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-primary)] p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.nickname}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-bronze)] text-xl font-bold text-white">
              {user.nickname.charAt(0)}
            </div>
          )}

          <div>
            <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
              {user.nickname}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">第 {user.current_level} 關</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-[var(--bg-secondary)] p-4">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">自我介紹</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
            {user.namecard?.bio?.trim() ? user.namecard.bio : "這位玩家還沒有填寫自我介紹。"}
          </p>
        </div>

        <div className="mt-3 rounded-xl bg-[var(--bg-secondary)] p-4">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">公開 Email</p>
          {user.namecard?.email ? (
            <a
              href={`mailto:${user.namecard.email}`}
              className="mt-1 inline-block break-all text-sm text-[var(--bg-header)] underline"
            >
              {user.namecard.email}
            </a>
          ) : (
            <p className="mt-1 text-sm text-[var(--text-primary)]">尚未公開</p>
          )}
        </div>

        <div className="mt-3 rounded-xl bg-[var(--bg-secondary)] p-4">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">連結</p>
          {links.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-all text-sm text-[var(--bg-header)] underline"
                >
                  {link}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-[var(--text-primary)]">尚未提供</p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-[var(--bg-header)] px-4 py-2.5 text-sm font-semibold text-[var(--text-light)]"
        >
          關閉
        </button>
      </div>
    </div>
  );
}
