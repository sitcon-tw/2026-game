"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ManualTokenInput() {
	const router = useRouter();
	const [manualToken, setManualToken] = useState("");
	const [showManualInput, setShowManualInput] = useState(false);

	return (
		<div className="mt-8">
			<div className="flex items-center gap-3 mb-4">
				<div className="h-px flex-1 bg-[var(--text-secondary)] opacity-30" />
				<span className="text-xs text-[var(--text-secondary)]">OR</span>
				<div className="h-px flex-1 bg-[var(--text-secondary)] opacity-30" />
			</div>
			<button onClick={() => setShowManualInput(v => !v)} className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] cursor-pointer">
				<motion.span animate={{ rotate: showManualInput ? 90 : 0 }} transition={{ duration: 0.2 }} className="inline-block text-xs">
					▶
				</motion.span>
				手動輸入票券 Token
			</button>
			<AnimatePresence initial={false}>
				{showManualInput && (
					<motion.div
						key="manual-input"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div className="mt-4 flex flex-col gap-2">
							<input
								type="text"
								value={manualToken}
								onChange={e => setManualToken(e.target.value)}
								placeholder="輸入 Token"
								className="rounded-xl bg-[var(--bg-card)] px-4 py-3 font-mono text-sm text-[var(--text-light)] placeholder-[var(--text-secondary)] outline-none"
							/>
							<button
								onClick={() => {
									if (manualToken.trim()) {
										router.push(`/login?token=${encodeURIComponent(manualToken.trim())}`);
									}
								}}
								className="rounded-xl bg-[var(--bg-header)] px-6 py-3 font-medium text-[var(--text-light)] transition-opacity hover:opacity-90 cursor-pointer"
							>
								登入
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
