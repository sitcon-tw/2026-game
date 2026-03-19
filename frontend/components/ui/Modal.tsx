"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

interface ModalProps {
	open: boolean;
	/** Called when backdrop is clicked. Omit to disable backdrop dismiss. */
	onClose?: () => void;
	/** Extra classes on the card container (width, padding, etc.) */
	className?: string;
	children: ReactNode;
}

export default function Modal({ open, onClose, className = "w-full max-w-md p-5", children }: ModalProps) {
	return (
		<AnimatePresence>
			{open && (
				<motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
					{/* Backdrop */}
					{onClose ? <button type="button" aria-label="關閉" className="absolute inset-0 cursor-pointer bg-black/50" onClick={onClose} /> : <div className="absolute inset-0 bg-black/50" />}

					{/* Card */}
					<motion.div
						className={`relative max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--bg-primary)] shadow-2xl ${className}`}
						initial={{ opacity: 0, scale: 0.8, y: 30 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.7, y: 40 }}
						transition={{
							type: "spring",
							damping: 18,
							stiffness: 400,
							mass: 0.8
						}}
					>
						{children}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
