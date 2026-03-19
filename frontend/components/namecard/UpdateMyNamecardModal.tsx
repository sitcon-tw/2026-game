"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { useUpdateNamecard } from "@/hooks/api";
import Modal from "@/components/ui/Modal";

interface UpdateMyNamecardModalProps {
  open: boolean;
  onClose: () => void;
  nickname?: string;
  avatar?: string | null;
  initialBio?: string | null;
  initialLinks?: string[];
  initialEmail?: string | null;
}

export default function UpdateMyNamecardModal({
  open,
  onClose,
  nickname,
  avatar,
  initialBio,
  initialLinks,
  initialEmail,
}: UpdateMyNamecardModalProps) {
  const updateNamecard = useUpdateNamecard();
  const [bio, setBio] = useState("");
  const [linkInputs, setLinkInputs] = useState<string[]>([""]);
  const [email, setEmail] = useState("");

  const isSaving = updateNamecard.isPending;

  useEffect(() => {
    if (!open) return;
    setBio(initialBio ?? "");
    setLinkInputs(initialLinks && initialLinks.length > 0 ? initialLinks : [""]);
    setEmail(initialEmail ?? "");
  }, [open, initialBio, initialLinks, initialEmail]);

  const normalizedLinks = useMemo(
    () =>
      linkInputs
        .map((link) => link.trim())
        .filter(Boolean),
    [linkInputs],
  );

  return (
    <Modal open={open} onClose={onClose}>
            <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
              更新我的名牌
            </h2>

            <div className="mt-3 flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] p-3">
              {avatar ? (
                <img
                  src={avatar}
                  alt={nickname ?? "我的頭像"}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-bronze)] text-lg font-bold text-white">
                  {(nickname ?? "我").charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs text-[var(--text-secondary)]">目前名牌</p>
                <p className="font-serif text-lg font-semibold text-[var(--text-primary)]">
                  {nickname ?? "我"}
                </p>
              </div>
            </div>

            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              大頭貼請至 Gravatar 更新，將使用報名 SITCON 的 Email 顯示。
              <br />
              你填寫的 email 會公開顯示在名牌上，請確認再儲存。
            </p>

            <motion.a
              href="https://gravatar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex cursor-pointer rounded-full bg-[var(--bg-header)] px-4 py-2 text-sm font-semibold text-[var(--text-light)]"
              whileTap={{ scale: 0.95 }}
            >
              前往 Gravatar
            </motion.a>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
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
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
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

              <label className="block">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
                  連結
                </span>
                <div className="space-y-2">
                  {linkInputs.map((link, idx) => (
                    <div key={`namecard-link-${idx}`} className="flex gap-2">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => {
                          const next = [...linkInputs];
                          next[idx] = e.target.value;
                          setLinkInputs(next);
                        }}
                        className="w-full rounded-xl border border-[rgba(93,64,55,0.25)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-gold)]"
                        placeholder="https://example.com"
                      />
                      {linkInputs.length > 1 && (
                        <motion.button
                          type="button"
                          onClick={() => {
                            setLinkInputs(linkInputs.filter((_, i) => i !== idx));
                          }}
                          className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[var(--bg-secondary)] px-3 text-[var(--text-secondary)]"
                          aria-label="刪除連結"
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
                <motion.button
                  type="button"
                  onClick={() => setLinkInputs((prev) => [...prev, ""])}
                  className="mt-2 cursor-pointer rounded-full border border-[var(--bg-header)] px-3 py-1 text-xs font-semibold text-[var(--bg-header)] disabled:opacity-50"
                  disabled={linkInputs.length >= 20}
                  whileTap={{ scale: 0.95 }}
                >
                  新增連結
                </motion.button>
              </label>
            </div>


            {updateNamecard.error && (
              <p className="mt-3 text-sm text-[var(--status-error)]">
                更新失敗，請檢查欄位格式後重試。
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <motion.button
                type="button"
                onClick={onClose}
                className="flex-1 cursor-pointer rounded-full bg-[var(--bg-secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
                disabled={isSaving}
                whileTap={{ scale: 0.95 }}
              >
                取消
              </motion.button>
              <motion.button
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
                className="flex-1 cursor-pointer rounded-full bg-[var(--bg-header)] px-4 py-2.5 text-sm font-semibold text-[var(--text-light)] disabled:opacity-50"
                disabled={isSaving}
                whileTap={{ scale: 0.95 }}
              >
                {isSaving ? "儲存中..." : "儲存名牌"}
              </motion.button>
            </div>
    </Modal>
  );
}
