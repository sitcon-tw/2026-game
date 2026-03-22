"use client";

import Modal from "@/components/ui/Modal";
import { useUpdateNamecard } from "@/hooks/api";
import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

interface UpdateMyNamecardModalProps {
	open: boolean;
	onClose: () => void;
	nickname?: string;
	avatar?: string | null;
	initialBio?: string | null;
	initialLinks?: string[];
	initialEmail?: string | null;
}

function isValidEmail(value: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidLink(value: string) {
	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

export default function UpdateMyNamecardModal({ open, onClose, nickname, avatar, initialBio, initialLinks, initialEmail }: UpdateMyNamecardModalProps) {
	if (!open) return null;

	return (
		<Modal open={open} onClose={onClose}>
			<UpdateMyNamecardModalContent
				onClose={onClose}
				nickname={nickname}
				avatar={avatar}
				initialBio={initialBio}
				initialLinks={initialLinks}
				initialEmail={initialEmail}
			/>
		</Modal>
	);
}

function UpdateMyNamecardModalContent({ onClose, nickname, avatar, initialBio, initialLinks, initialEmail }: Omit<UpdateMyNamecardModalProps, "open">) {
	const updateNamecard = useUpdateNamecard();
	const [bio, setBio] = useState(initialBio ?? "");
	const [linkInputs, setLinkInputs] = useState<string[]>(initialLinks && initialLinks.length > 0 ? initialLinks : [""]);
	const [email, setEmail] = useState(initialEmail ?? "");

	const isSaving = updateNamecard.isPending;

	const normalizedLinks = useMemo(() => linkInputs.map(link => link.trim()).filter(Boolean), [linkInputs]);
	const normalizedEmail = email.trim();
	const emailError = normalizedEmail && !isValidEmail(normalizedEmail) ? "Email 格式不正確" : "";
	const linkError = useMemo(() => {
		const invalidLink = normalizedLinks.find(link => !isValidLink(link));
		if (!invalidLink) return "";
		return "連結格式不正確，請使用 http:// 或 https:// 開頭";
	}, [normalizedLinks]);
	const canSubmit = !isSaving && !emailError && !linkError;

	return (
		<>
			<h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">更新我的名牌</h2>

			<div className="mt-3 flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] p-3">
				{avatar ? (
					<img src={avatar} alt={nickname ?? "我的頭像"} className="h-12 w-12 rounded-full object-cover" />
				) : (
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-bronze)] text-lg font-bold text-white">{(nickname ?? "我").charAt(0)}</div>
				)}
				<div>
					<p className="text-xs text-[var(--text-secondary)]">目前名牌</p>
					<p className="font-serif text-lg font-semibold text-[var(--text-primary)]">{nickname ?? "我"}</p>
				</div>
			</div>

			<p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
				當你更新這裡的公開 Email 時，系統會自動把大頭貼更新成該 Email 對應的 Gravatar。如果沒公開過 Email 則會用報名 SITCON 時所填的 Email。
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
					<span className="block text-sm font-semibold text-[var(--text-primary)]">自我介紹</span>
					<textarea
						value={bio}
						onChange={e => setBio(e.target.value)}
						rows={4}
						maxLength={500}
						className="w-full rounded-xl border border-[rgba(93,64,55,0.25)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-gold)]"
						placeholder="想讓別人認識你的內容"
					/>
				</label>

				<label className="block">
					<span className="block text-sm font-semibold text-[var(--text-primary)]">公開聯絡 Email</span>
					<input
						type="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						maxLength={254}
						className="w-full rounded-xl border border-[rgba(93,64,55,0.25)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-gold)]"
						placeholder="name@example.com"
					/>
					{emailError && <p className="mt-1 text-xs text-[var(--status-error)]">{emailError}</p>}
				</label>

				<label className="block">
					<span className="block text-sm font-semibold text-[var(--text-primary)]">連結</span>
					<div className="space-y-2">
						{linkInputs.map((link, idx) => (
							<div key={`namecard-link-${idx}`} className="flex gap-2">
								<input
									type="url"
									value={link}
									onChange={e => {
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
						onClick={() => setLinkInputs(prev => [...prev, ""])}
						className="mt-2 cursor-pointer rounded-full border border-[var(--bg-header)] px-3 py-1 text-xs font-semibold text-[var(--bg-header)] disabled:opacity-50"
						disabled={linkInputs.length >= 20}
						whileTap={{ scale: 0.95 }}
					>
						新增連結
					</motion.button>
					{linkError && <p className="mt-2 text-xs text-[var(--status-error)]">{linkError}</p>}
				</label>
			</div>

			{updateNamecard.error && <p className="mt-3 text-sm text-[var(--status-error)]">更新失敗，請檢查欄位格式後重試。</p>}

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
						if (!canSubmit) return;
						updateNamecard.mutate(
							{
								bio,
								links: normalizedLinks,
								email: normalizedEmail
							},
							{
								onSuccess: () => onClose()
							}
						);
					}}
					className="flex-1 cursor-pointer rounded-full bg-[var(--bg-header)] px-4 py-2.5 text-sm font-semibold text-[var(--text-light)] disabled:opacity-50"
					disabled={!canSubmit}
					whileTap={{ scale: 0.95 }}
				>
					{isSaving ? "儲存中..." : "儲存名牌"}
				</motion.button>
			</div>
		</>
	);
}
