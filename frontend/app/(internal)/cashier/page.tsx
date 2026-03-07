"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useStaffLogin,
  useStaffLookupCoupons,
  useStaffRedeemCoupon,
  useStaffRedemptionHistory,
} from "@/hooks/api";
import { useStaffStore, usePopupStore } from "@/stores";
import { translateWithContext } from "@/lib/scanMessages";
import type { ScanStatus } from "@/lib/scanMessages";
import QrScanner from "@/components/QrScanner";
import { RedemptionCard } from "@/components/staff/RedemptionCard";
import { RedemptionHistoryList } from "@/components/staff/RedemptionHistoryList";
import { GetUserCouponsResponse } from "@/types/api";

function StaffScanContent() {
  const [scanStatus, setScanStatus] = useState<ScanStatus>({ type: "idle" });
  const [scannedUserCouponToken, setScannedUserCouponToken] = useState<
    string | null
  >(null);
  const [lookupResult, setLookupResult] =
    useState<GetUserCouponsResponse | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showPopup = usePopupStore((s) => s.showPopup);

  // Staff store
  const { staffToken, staffName, setStaffToken, setStaffName, clearStaff } =
    useStaffStore();

  // API hooks
  const staffLogin = useStaffLogin();
  const staffLookupCoupons = useStaffLookupCoupons();
  const staffRedeemCoupon = useStaffRedeemCoupon();
  const { data: redemptionHistory, isLoading: historyLoading } =
    useStaffRedemptionHistory();

  // ── 1. Read token from URL and login ──
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setStaffToken(tokenFromUrl);
      staffLogin.mutate(tokenFromUrl, {
        onSuccess: (data: any) => {
          if (data?.name) setStaffName(data.name);
          setScanStatus({ type: "idle" });
        },
        onError: (error) => {
          console.error("Staff login failed:", error);
          setScanStatus({
            type: "error",
            message: translateWithContext(
              "staff-login",
              error instanceof Error ? error.message : undefined,
              "工作人員登入失敗，請確認連結是否正確",
            ),
          });
        },
      });
    } else if (!staffToken) {
      setScanStatus({
        type: "error",
        message: "缺少工作人員 token，請使用正確連結進入",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── 2. Handle QR scan → lookup coupons ──
  const handleScan = useCallback(
    (result: { rawValue: string }[]) => {
      if (!result.length) return;
      if (
        scanStatus.type === "scanning" ||
        staffLookupCoupons.isPending ||
        staffRedeemCoupon.isPending
      )
        return;

      const userCouponToken = result[0].rawValue;
      setScannedUserCouponToken(userCouponToken);
      setScanStatus({ type: "scanning" });

      staffLookupCoupons.mutate(userCouponToken, {
        onSuccess: (data) => {
          setLookupResult(data);
          setScanStatus({ type: "idle" });
        },
        onError: (error) => {
          const apiMessage =
            error instanceof Error ? error.message : undefined;
          showPopup({
            title: "查詢失敗",
            description: apiMessage || "查詢折扣券失敗。可能的原因：玩家持個人 QR Code，請確認玩家切換至折價券專用兌換 QR Code。",
          });
          setScanStatus({ type: "idle" });
        },
      });
    },
    [scanStatus, staffLookupCoupons, staffRedeemCoupon, showPopup],
  );

  // ── 3. Cancel lookup ──
  const handleCancelLookup = useCallback(() => {
    setLookupResult(null);
    setScannedUserCouponToken(null);
    setScanStatus({ type: "idle" });
  }, []);

  // ── 4. Handle coupon redemption ──
  const handleConfirmRedeem = useCallback(() => {
    if (!scannedUserCouponToken || staffRedeemCoupon.isPending) return;

    setScanStatus({ type: "scanning" });

    staffRedeemCoupon.mutate(scannedUserCouponToken, {
      onSuccess: (data) => {
        setLookupResult(null);
        setScannedUserCouponToken(null);
        setScanStatus({ type: "idle" });

        showPopup({
          title: "核銷成功",
          description: `${data.user_name ? `玩家：${data.user_name}\n` : ""}共折抵 ${data.total} 元`,
        });
      },
      onError: (error) => {
        const apiMessage =
          error instanceof Error ? error.message : undefined;
        setScanStatus({ type: "idle" });
        showPopup({
          title: "核銷失敗",
          description: apiMessage || "核銷失敗，請重試",
        });
      },
    });
  }, [scannedUserCouponToken, staffRedeemCoupon, showPopup]);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-8">
      {/* Title */}
      <h1 className="text-center font-serif text-3xl font-bold leading-snug text-[var(--text-primary)]">
        折價券掃描器
      </h1>

      {/* Login error */}
      {staffLogin.isError && (
        <div className="mt-4 w-full max-w-[340px] rounded-2xl bg-red-50 px-5 py-4 ring-1 ring-red-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-serif font-bold text-red-800">登入失敗</p>
              <p className="mt-1 text-sm text-red-600">
                {scanStatus.type === "error"
                  ? scanStatus.message
                  : "工作人員登入失敗，請確認連結是否正確"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scanner area */}
      <div className="my-8">
        <QrScanner onScan={handleScan} scanStatus={scanStatus} />
      </div>

      {/* Lookup Result Card */}
      {lookupResult && (
        <RedemptionCard
          lookupResult={lookupResult}
          onConfirmRedeem={handleConfirmRedeem}
          onCancel={handleCancelLookup}
          isRedeeming={staffRedeemCoupon.isPending}
        />
      )}

      {/* Redemption History */}
      {!lookupResult && (
        <RedemptionHistoryList
          history={redemptionHistory ?? []}
          isLoading={historyLoading}
        />
      )}

      {/* Identity Switcher Button */}
      <button
        type="button"
        onClick={() => {
          router.push("/play");
          clearStaff();
        }}
        className="fixed bottom-20 right-6 z-50 flex flex-col items-center gap-1 transition-transform active:scale-95"
        aria-label="切換身份"
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#59360B] shadow-lg">
          <Image src="/assets/switch.svg" alt="Switch" width={32} height={32} />
        </div>
        <span className="whitespace-nowrap font-serif text-lg font-bold text-[var(--text-primary)]">
          玩家 / 工作人員
        </span>
      </button>
    </div>
  );
}

export default function StaffScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="text-lg text-[var(--text-primary)]">載入中...</div>
        </div>
      }
    >
      <StaffScanContent />
    </Suspense>
  );
}
