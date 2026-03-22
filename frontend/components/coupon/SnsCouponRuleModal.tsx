import Modal from "@/components/ui/Modal";

export default function SnsCouponRuleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	return (
		<Modal open={open} onClose={onClose} className="w-full max-w-sm overflow-hidden p-0">
			<div className="bg-[var(--accent-gold)] px-6 py-5 text-white">
				<h3 className="text-lg font-bold">限時動態或貼文分享兌換方式</h3>
				<p className="mt-1 text-sm text-white/90">完成分享後，請至指定地點出示畫面兌換。</p>
			</div>

			<div className="space-y-4 px-6 py-5 text-left">
				<div className="rounded-xl bg-[var(--accent-bronze)]/10 px-4 py-3">
					<p className="text-sm font-semibold text-[var(--text-primary)]">打卡平台</p>
					<p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">IG、FB、Threads、X（前身是 Twitter） 的限時動態或貼文分享皆可。</p>
				</div>
				<div className="rounded-xl bg-[var(--accent-bronze)]/10 px-4 py-3">
					<p className="text-sm font-semibold text-[var(--text-primary)]">成功條件</p>
					<p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">內容需提及 @sitcon.tw 並 Tag #SITCON2026，才算分享成功。</p>
				</div>
				<div className="rounded-xl bg-[var(--accent-bronze)]/10 px-4 py-3">
					<p className="text-sm font-semibold text-[var(--text-primary)]">兌換時間</p>
					<p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">10:00-12:00</p>
				</div>
				<div className="rounded-xl bg-[var(--accent-bronze)]/10 px-4 py-3">
					<p className="text-sm font-semibold text-[var(--text-primary)]">兌換地點</p>
					<p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">請至 2F 議程組服務台，向工作人員出示你的限時動態或貼文分享畫面兌換。</p>
				</div>
			</div>

			<div className="px-6 pb-6">
				<button
					onClick={onClose}
					className="w-full rounded-full bg-[var(--bg-header)] py-3 text-base font-bold tracking-widest text-[var(--text-light)] shadow-md transition-transform active:scale-95"
				>
					知道了
				</button>
			</div>
		</Modal>
	);
}
