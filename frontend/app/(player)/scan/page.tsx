"use client";

import QrScanner from "@/components/QrScanner";
import MyNamecardCard from "@/components/namecard/MyNamecardCard";
import UpdateMyNamecardModal from "@/components/namecard/UpdateMyNamecardModal";
import UserNamecardModal from "@/components/namecard/UserNamecardModal";
import LocalQRCode from "@/components/ui/LocalQRCode";
import Modal from "@/components/ui/Modal";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAddFriend, useCheckinActivity, useCurrentUser, useFriendCount, useOneTimeQR } from "@/hooks/api";
import type { ScanStatus } from "@/lib/scanMessages";
import { isSuccessStatus, translateWithContext } from "@/lib/scanMessages";
import { usePopupStore } from "@/stores";
import type { FriendPublicProfile } from "@/types/api";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";

export default function ScanPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [showEditNamecard, setShowEditNamecard] = useState(false);
  const [qrEnlarged, setQrEnlarged] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>({ type: "idle" });
  const [newFriend, setNewFriend] = useState<FriendPublicProfile | null>(null);

  const showPopup = usePopupStore(s => s.showPopup);
  const { data: oneTimeQR } = useOneTimeQR();
  const { data: currentUser } = useCurrentUser();
  const { data: friendData } = useFriendCount();
  const addFriend = useAddFriend();
  const checkinActivity = useCheckinActivity();

  const friendCount = friendData?.count ?? 0;
  const friendLimit = friendData?.max ?? 20;
  const remaining = friendLimit - friendCount;
  const progress = friendLimit > 0 ? friendCount / friendLimit : 0;

  const handleScan = useCallback(
    (result: { rawValue: string }[]) => {
      if (!result.length) return;
      if (scanStatus.type === "scanning" || addFriend.isPending || checkinActivity.isPending) return;

      const value = result[0].rawValue;
      console.log("Scanned QR:", value);
      setScanStatus({ type: "scanning" });

      if (value.startsWith("qru1.")) {
        addFriend.mutate(value, {
          onSuccess: data => {
            setScanStatus({
              type: "success",
              message: translateWithContext("friendship", "friendship created")
            });
            if (data && typeof data === "object" && "id" in data) {
              setNewFriend(data);
            }
            setTimeout(() => setScanStatus({ type: "idle" }), 2000);
          },
          onError: err => {
            const msg = translateWithContext("friendship", err instanceof Error ? err.message : undefined, "加朋友失敗，請重試");
            setScanStatus({ type: "error", message: msg });
            setTimeout(() => setScanStatus({ type: "idle" }), 3000);
          }
        });
      } else {
        checkinActivity.mutate(value, {
          onSuccess: data => {
            const msg = translateWithContext("activity-checkin", data?.status, "打卡成功！");
            setScanStatus({
              type: isSuccessStatus(data?.status) ? "success" : "error",
              message: msg
            });
            setTimeout(() => setScanStatus({ type: "idle" }), 2000);
          },
          onError: err => {
            const msg = translateWithContext("activity-checkin", err instanceof Error ? err.message : undefined, "打卡失敗，請重試");
            setScanStatus({ type: "error", message: msg });
            setTimeout(() => setScanStatus({ type: "idle" }), 3000);
          }
        });
      }
    },
    [scanStatus, addFriend, checkinActivity]
  );

  const namecardLinks = currentUser?.namecard_links ?? [];

  const friendInfo = (
    <>
      <p className="mt-6 text-center font-serif text-base text-[var(--text-secondary)] leading-relaxed">
        {!friendData ? (
          <>
            在你逛更多攤位以前
            <br />
            還可認識 <span className="inline-block h-4 w-6 animate-pulse rounded bg-current opacity-20 align-middle" /> 位朋友
          </>
        ) : remaining <= 0 ? (
          <span className="font-semibold text-[var(--text-primary)]">你太 E 了，已達加好友上限。</span>
        ) : (
          <>
            在你逛更多攤位以前
            <br />
            還可認識 <span className="font-semibold text-[var(--text-primary)]">{remaining}</span> 位朋友
          </>
        )}
      </p>

      <ProgressBar percent={progress * 100} variant="subtle" loading={!friendData} className="mt-3 w-40" />

      {friendData && remaining <= 0 && (
        <button
          type="button"
          className="mt-2 cursor-pointer font-serif text-sm underline text-[var(--text-secondary)]"
          onClick={() =>
            showPopup({
              title: "解鎖更多好友額度",
              description: "打卡更多攤位，解鎖加朋友額度。"
            })
          }
        >
          了解更多
        </button>
      )}
    </>
  );

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-8">
      <AnimatePresence mode="wait">
        {showScanner ? (
          /* ── Scanner mode ── */
          <motion.div key="scanner" className="flex w-full flex-col items-center" initial={{ x: 60 }} animate={{ x: 0 }} exit={{ x: 60 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
            <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] text-center leading-snug">
              掃描 QR Code
              <br />
              獲得碎片
            </h1>

            <div className="mt-8">
              <QrScanner onScan={handleScan} scanStatus={scanStatus} />
            </div>

            {friendInfo}

            <motion.button
              type="button"
              onClick={() => setShowScanner(false)}
              className="mt-8 cursor-pointer rounded-full bg-[var(--bg-header)] px-8 py-3 font-serif text-lg font-semibold text-[var(--text-light)] shadow-md"
              whileTap={{ scale: 0.95 }}
            >
              回到我的名牌
            </motion.button>
          </motion.div>
        ) : (
          /* ── Namecard-first view ── */
          <motion.div
            key="namecard"
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] text-center leading-snug">我的名片</h1>

            <MyNamecardCard
              nickname={currentUser?.nickname}
              avatar={currentUser?.avatar}
              currentLevel={currentUser?.current_level}
              bio={currentUser?.namecard_bio}
              email={currentUser?.namecard_email}
              links={namecardLinks}
              qrToken={oneTimeQR?.token}
              onEdit={() => setShowEditNamecard(true)}
              onEnlargeQR={() => setQrEnlarged(true)}
            />

            {/* Action buttons */}
            <motion.div className="mt-6 flex w-full max-w-md flex-wrap gap-3" initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}>
              <motion.button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex-1 min-w-[140px] cursor-pointer rounded-full bg-[var(--bg-header)] px-6 py-3 font-serif text-base font-semibold text-[var(--text-light)] shadow-md"
                whileTap={{ scale: 0.95 }}
              >
                加好友
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex-1 min-w-[140px] cursor-pointer rounded-full bg-[var(--bg-header)] px-6 py-3 font-serif text-base font-semibold text-[var(--text-light)] shadow-md"
                whileTap={{ scale: 0.95 }}
              >
                開啟掃描器
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enlarged QR modal */}
      <Modal open={qrEnlarged} onClose={() => setQrEnlarged(false)} className="flex flex-col items-center gap-4 bg-white p-6">
        {oneTimeQR?.token ? (
          <LocalQRCode value={oneTimeQR.token} size={256} ariaLabel="我的 QR Code" className="h-64 w-64 overflow-hidden rounded-md" />
        ) : (
          <div className="h-64 w-64 animate-pulse rounded-md bg-[#ccc]" />
        )}
        <p className="text-sm text-[var(--text-secondary)]">讓朋友掃描你的 QR Code</p>
        <motion.button
          type="button"
          onClick={() => setQrEnlarged(false)}
          className="cursor-pointer rounded-full bg-[var(--bg-header)] px-6 py-2 text-sm font-semibold text-[var(--text-light)]"
          whileTap={{ scale: 0.95 }}
        >
          關閉
        </motion.button>
      </Modal>

      <UpdateMyNamecardModal
        open={showEditNamecard}
        onClose={() => setShowEditNamecard(false)}
        nickname={currentUser?.nickname}
        avatar={currentUser?.avatar}
        initialBio={currentUser?.namecard_bio}
        initialLinks={currentUser?.namecard_links}
        initialEmail={currentUser?.namecard_email}
      />

      <UserNamecardModal open={!!newFriend} onClose={() => setNewFriend(null)} user={newFriend} />
    </div>
  );
}
