const GAME_RULES = [
  {
    icon: "▶",
    title: "開始遊戲",
    description: "進入關卡後，點擊畫面中央的播放按鈕即可開始。",
  },
  {
    icon: "🎵",
    title: "觀察順序",
    description: "遊戲會依序點亮按鈕並播放對應音效，請仔細記住亮起的順序。",
  },
  {
    icon: "👆",
    title: "依序點擊",
    description:
      "序列播放完畢後，依相同順序點擊按鈕。全部正確即通關，任一錯誤則失敗，可重新挑戰。",
  },
  {
    icon: "🔓",
    title: "起始關卡",
    description:
      "起始已解鎖關卡為 5 關，會眾需透過與攤位互動、打卡、認識新朋友等方式解鎖新關卡。",
  },
  {
    icon: "🎮",
    title: "按鈕數量",
    description:
      "第一關按鈕為 2 個，2～5 關 4 個，後續每五關增加四個按鈕，最多為 32 個按鈕。",
  },
];

const BUTTON_TABLE = [
  { range: "第 1 關", buttons: 2, grid: "1 × 2" },
  { range: "第 2–5 關", buttons: 4, grid: "2 × 2" },
  { range: "第 6–10 關", buttons: 8, grid: "2 × 4" },
  { range: "第 11–15 關", buttons: 12, grid: "3 × 4" },
  { range: "第 16–20 關", buttons: 16, grid: "4 × 4" },
  { range: "第 21–25 關", buttons: 20, grid: "4 × 5" },
  { range: "第 26–30 關", buttons: 24, grid: "4 × 6" },
  { range: "第 31–35 關", buttons: 28, grid: "4 × 7" },
  { range: "第 36–40 關", buttons: 32, grid: "4 × 8" },
];

export default function ChallengesPage() {
  return (
    <div className="px-6 pt-8 pb-[calc(var(--navbar-height)+1.5rem)] space-y-6">
      {/* Page Title */}
      <h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center">
        闖關規則
      </h1>

      {/* Rule Cards */}
      <div className="space-y-4">
        {GAME_RULES.map((rule) => (
          <div
            key={rule.title}
            className="rounded-[var(--border-radius)] bg-[var(--bg-secondary)] p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl leading-none mt-0.5">{rule.icon}</span>
              <div className="flex-1">
                <h2 className="text-[var(--text-primary)] font-serif text-xl font-bold mb-1">
                  {rule.title}
                </h2>
                <p className="text-[var(--text-secondary)] text-base leading-relaxed">
                  {rule.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Button Count Table */}
      <div className="rounded-[var(--border-radius)] bg-[var(--bg-secondary)] p-5 shadow-sm">
        <h2 className="text-[var(--text-primary)] font-serif text-xl font-bold mb-4 text-center">
          各關卡按鈕數量
        </h2>
        <div className="overflow-hidden rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-header)] text-[var(--text-light)]">
                <th className="px-3 py-2 text-left font-semibold">關卡</th>
                <th className="px-3 py-2 text-center font-semibold">按鈕數</th>
                <th className="px-3 py-2 text-center font-semibold">排列</th>
              </tr>
            </thead>
            <tbody>
              {BUTTON_TABLE.map((row, i) => (
                <tr
                  key={row.range}
                  className={
                    i % 2 === 0
                      ? "bg-[var(--bg-primary)]"
                      : "bg-[var(--bg-secondary)]"
                  }
                >
                  <td className="px-3 py-2 text-[var(--text-primary)] font-medium">
                    {row.range}
                  </td>
                  <td className="px-3 py-2 text-center text-[var(--accent-gold)] font-bold">
                    {row.buttons}
                  </td>
                  <td className="px-3 py-2 text-center text-[var(--text-secondary)]">
                    {row.grid}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
