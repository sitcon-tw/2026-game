const GAME_RULES = [
	{
		icon: "▶",
		title: "開始遊戲",
		description: "進入關卡後，點擊畫面中央的播放按鈕即可開始。"
	},
	{
		icon: "🎵",
		title: "觀察順序",
		description: "遊戲會依序點亮按鈕並播放對應音效，請仔細記住亮起的順序。"
	},
	{
		icon: "👆",
		title: "依序點擊",
		description: "序列播放完畢後，依相同順序點擊按鈕。全部正確即通關，任一錯誤則失敗，可重新挑戰。"
	},
	{
		icon: "🔓",
		title: "起始關卡",
		description: "起始已解鎖關卡為 5 關，會眾需透過與攤位互動、打卡、認識新朋友等方式解鎖新關卡。"
	},
	{
		icon: "🎮",
		title: "按鈕數量",
		description: "每關的按鈕數量依據該關使用的音符種類決定，按鈕位置每次進入關卡時隨機排列。"
	},
	{
		icon: "🔇",
		title: "iPhone / iPad 使用者",
		description: "遊戲需要播放音效，請確認已關閉靜音模式（側邊開關），才能聽到樂譜的聲音。"
	}
];

export default function ChallengesPage() {
	return (
		<div className="px-6 pt-8 pb-[calc(var(--navbar-height)+1.5rem)] space-y-6">
			{/* Page Title */}
			<h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center">闖關規則</h1>

			{/* Rule Cards */}
			<div className="space-y-4">
				{GAME_RULES.map(rule => (
					<div key={rule.title} className="rounded-[var(--border-radius)] bg-[var(--bg-secondary)] p-5 shadow-sm">
						<div className="flex items-start gap-4">
							<span className="text-3xl leading-none mt-0.5">{rule.icon}</span>
							<div className="flex-1">
								<h2 className="text-[var(--text-primary)] font-serif text-xl font-bold mb-1">{rule.title}</h2>
								<p className="text-[var(--text-secondary)] text-base leading-relaxed">{rule.description}</p>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Tutorial videos */}
			<div className="rounded-[var(--border-radius)] bg-[var(--bg-secondary)] p-5 shadow-sm">
				<div className="flex items-start gap-4">
					<span className="text-3xl leading-none mt-0.5">🎬</span>
					<div className="flex-1">
						<h2 className="text-[var(--text-primary)] font-serif text-xl font-bold mb-1">關閉靜音模式教學</h2>
						<div className="flex flex-col gap-2 mt-2">
							<a href="https://www.youtube.com/watch?v=OHw_kf4o8xM" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-gold)] text-base underline">無實體按鍵操作影片</a>
							<a href="https://www.youtube.com/watch?v=mlNh4dM9ddE" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-gold)] text-base underline">有實體按鍵操作影片</a>
						</div>
					</div>
				</div>
			</div>

			</div>
	);
}
