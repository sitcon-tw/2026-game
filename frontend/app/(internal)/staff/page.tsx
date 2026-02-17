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
import { useStaffStore } from "@/stores";
import { translateWithContext, isSuccessStatus } from "@/lib/scanMessages";
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
    useState<GetUserCouponsResponse | null>(null); // Store lookup result
  const router = useRouter();
  const searchParams = useSearchParams();

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
          // Note: The staffLogin API might not return `name` directly.
          // Adjust based on actual API response for staff name.
        },
        onError: (error) => {
          console.error("Staff login failed:", error);
          setScanStatus({
            type: "error",
            message: translateWithContext(
              "staff-login",
              error instanceof Error ? error.message : undefined,
              "工作人員登入失敗，請確認連結是否正確"
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
      console.log("Scanned user coupon token:", userCouponToken);
      setScannedUserCouponToken(userCouponToken);
      setScanStatus({ type: "scanning" });

      staffLookupCoupons.mutate(
        userCouponToken,
        {
          onSuccess: (data) => {
            setLookupResult(data);
            setScanStatus({
              type: "success",
              message: `已查詢到 ${data.total} 元折扣`,
            });
            // Keep the success message for a bit longer for user to see
            // setTimeout(() => setScanStatus({ type: "idle" }), 2000);
          },
          onError: (error) => {
            const msg = translateWithContext(
              "staff-redeem", // Using redeem context for lookup errors for now
              error instanceof Error ? error.message : undefined,
              "查詢折扣券失敗，請重試"
            );
            setScanStatus({ type: "error", message: msg });
            setTimeout(() => setScanStatus({ type: "idle" }), 3000);
          },
        }
      );
    },
    [scanStatus, staffLookupCoupons, staffRedeemCoupon]
  );

  // ── 3. Handle coupon redemption ──
  const handleConfirmRedeem = useCallback(() => {
    if (!scannedUserCouponToken || staffRedeemCoupon.isPending) return;

    setScanStatus({ type: "scanning" }); // Indicate redemption is in progress

    staffRedeemCoupon.mutate(
      scannedUserCouponToken,
      {
        onSuccess: (data) => {
          setLookupResult(null); // Clear lookup result after redemption
          setScannedUserCouponToken(null);
          setScanStatus({
            type: "success",
            message: `核銷成功！共折抵 ${data.total} 元`,
          });
          setTimeout(() => setScanStatus({ type: "idle" }), 2000);
        },
        onError: (error) => {
          const msg = translateWithContext(
            "staff-redeem",
            error instanceof Error ? error.message : undefined,
            "核銷失敗，請重試"
          );
          setScanStatus({ type: "error", message: msg });
          setTimeout(() => setScanStatus({ type: "idle" }), 3000);
        },
      }
    );
  }, [scannedUserCouponToken, staffRedeemCoupon]);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-8">
      {/* Title */}
      <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] text-center leading-snug">
        {staffName ?? "折價券掃描器"}
      </h1>

      {/* Login error */}
      {staffLogin.isError && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-red-700 text-sm w-full max-w-[300px] text-center">
          {scanStatus.type === "error" && scanStatus.message}
        </div>
      )}
      {!staffToken && !staffLogin.isError && (
          <div className="mt-4 rounded-lg bg-yellow-100 px-4 py-3 text-yellow-700 text-sm w-full max-w-[300px] text-center">
              請掃描工作人員登入 QR Code
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
          isRedeeming={staffRedeemCoupon.isPending}
        />
      )}

      {/* Redemption History */}
      {!lookupResult && ( // Only show history if no lookup result is displayed
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
          clearStaff(); // Clear staff token when switching to player mode
        }}
        className="fixed bottom-20 right-6 z-50 flex flex-col items-center gap-1 transition-transform active:scale-95"
        aria-label="切換身份"
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#59360B] shadow-lg">
          <Image
            src="/assets/switch.svg"
            alt="Switch"
            width={32}
            height={32}
          />
        </div>
        <span className="font-serif text-lg font-bold text-[var(--text-primary)] whitespace-nowrap">
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
