"use client";

import { useEffect, useMemo, useState } from "react";
import { useUpdateNamecard } from "@/hooks/api";

interface UpdateMyNamecardModalProps {
  open: boolean;
  onClose: () => void;
  initialBio?: string | null;
  initialLinks?: string[];
  initialEmail?: string | null;
}

export default function UpdateMyNamecardModal({
  open,
  onClose,
  initialBio,
  initialLinks,
  initialEmail,
}: UpdateMyNamecardModalProps) {
  const updateNamecard = useUpdateNamecard();
  const [bio, setBio] = useState("");
  const [linksText, setLinksText] = useState("");
  const [email, setEmail] = useState("");

  const isSaving = updateNamecard.isPending;

  useEffect(() => {
    if (!open) return;
    setBio(initialBio ?? "");
    setLinksText((initialLinks ?? []).join("\n"));
    setEmail(initialEmail ?? "");
  }, [open, initialBio, initialLinks, initialEmail]);

  const normalizedLinks = useMemo(
    () =>
      linksText
        .split("\n")
        .map((link) => link.trim())
        .filter(Boolean),
    [linksText],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="關閉更新名牌視窗"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-primary)] p-5 shadow-2xl">
        <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
          更新我的名牌
        </h2>

        <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
          頭像請到 Gravatar 更新。
          <br />
          你填寫的 email 會公開顯示在名牌上，請確認再儲存。
        </p>

        <a
          href="https://gravatar.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex rounded-full bg-[var(--bg-header)] px-4 py-2 text-sm font-semibold text-[var(--text-light)]"
        >
          前往 Gravatar
        </a>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[var(--text-primary)]">
              自我介紹
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full rounded-xl border border-[rgba(93,64,55,0.25)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-gold)]"
              placeholder="想讓別人認識你的內容"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[var(--text-primary)]">
              連結（每行一個）
            </span>
            <textarea
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[rgba(93,64,55,0.25)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-gold)]"
              placeholder="https://example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[var(--text-primary)]">
              公開 Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              className="w-full rounded-xl border border-[rgba(93,64,55,0.25)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-gold)]"
              placeholder="name@example.com"
            />
          </label>
        </div>

        {updateNamecard.error && (
          <p className="mt-3 text-sm text-[var(--status-error)]">
            更新失敗，請檢查欄位格式後重試。
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-[var(--bg-secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
            disabled={isSaving}
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              updateNamecard.mutate(
                {
                  bio,
                  links: normalizedLinks,
                  email,
                },
                {
                  onSuccess: () => onClose(),
                },
              );
            }}
            className="flex-1 rounded-full bg-[var(--bg-header)] px-4 py-2.5 text-sm font-semibold text-[var(--text-light)] disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? "儲存中..." : "儲存名牌"}
          </button>
        </div>
      </div>
    </div>
  );
}
