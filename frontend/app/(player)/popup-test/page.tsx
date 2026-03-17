"use client";

import { usePopupStore } from "@/stores";

export default function TestPage() {
  const showPopup = usePopupStore((s) => s.showPopup);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-serif text-2xl font-bold">Popup 測試頁</h1>

      <button
        onClick={() =>
          showPopup({
            title: "獲得新優惠券！",
            description: "恭喜你獲得 50 元折價券",
            image: "/assets/coupon-reward.png",
            cta: { name: "查看優惠券", link: "/coupon" },
            doneText: "知道了",
          })
        }
        className="rounded-full bg-[var(--accent-gold)] px-6 py-3 font-bold text-white active:scale-95"
      >
        測試：有圖 + CTA
      </button>

      <button
        onClick={() =>
          showPopup({
            title: "交朋友已滿！",
            description: "你已經收集到所有朋友了，快去領取獎勵吧。",
          })
        }
        className="rounded-full bg-[var(--bg-header)] px-6 py-3 font-bold text-[var(--text-light)] active:scale-95"
      >
        測試：純文字
      </button>

      <button
        onClick={() => {
          showPopup({ title: "第一個通知", description: "這是佇列中的第一個" });
          showPopup({ title: "第二個通知", description: "關掉第一個後會看到我" });
        }}
        className="rounded-full bg-[var(--bg-header)] px-6 py-3 font-bold text-[var(--text-light)] active:scale-95"
      >
        測試：佇列（連續兩個）
      </button>
    </div>
  );
}
