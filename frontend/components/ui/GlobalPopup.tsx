"use client";

import Modal from "@/components/ui/Modal";
import { usePopupStore } from "@/stores";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function GlobalPopup() {
	const router = useRouter();
	const popups = usePopupStore(s => s.popups);
	const dismissPopup = usePopupStore(s => s.dismissPopup);

	const current = popups[0] ?? null;

	if (!current) return null;

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
		<Modal open={!!current} className="w-full max-w-sm overflow-hidden p-0">
			{/* Image */}
			{current.image && (
				<div className="relative aspect-[4/3] w-full">
					<Image src={current.image} alt={current.title} fill className="object-contain" />
				</div>
			)}

			{/* Content */}
			<div className="space-y-3 p-6">
				<h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">{current.title}</h2>
				{current.description && <p className="text-sm text-[var(--text-secondary)]">{current.description}</p>}
			</div>

			{/* Buttons */}
			<div className="space-y-3 px-6 pb-6">
				{current.cta && (
					<button onClick={handleCta} className="w-full rounded-full bg-[var(--accent-gold)] py-3 text-base font-bold tracking-widest text-white shadow-md transition-transform active:scale-95">
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
		</Modal>
	);
}
