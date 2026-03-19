"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function BoothsLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	return (
		<div className="flex flex-col h-full bg-[var(--bg-primary)]">
			{/* Top Toggle Bar */}
			<div className="sticky top-0 z-30 flex items-center bg-[var(--bg-header-in-layout)] px-4 py-3">
				{/* Back */}
				<button type="button" onClick={() => router.push("/play")} className="relative h-10 w-10 rounded-full cursor-pointer" aria-label="返回">
					<Image src="/assets/challenge/arrow-left.svg" alt="返回" fill className="object-contain" />
				</button>
			</div>

			{/* Page Content */}
			<div className="pb-[calc(var(--navbar-height)+1.5rem)]">{children}</div>
		</div>
	);
}
