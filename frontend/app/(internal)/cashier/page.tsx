"use client";
import QrScanner from "@/components/QrScanner";
import { RedemptionCard } from "@/components/staff/RedemptionCard";
import { RedemptionHistoryList } from "@/components/staff/RedemptionHistoryList";
import { useStaffAssignCouponByQRCode, useStaffLogin, useStaffLookupCoupons, useStaffRedeemCoupon, useStaffRedemptionHistory, useStaffScanAssignmentHistory } from "@/hooks/api";
import { scrubTokenFromCurrentUrl } from "@/lib/authUrl";
import type { ScanStatus } from "@/lib/scanMessages";
import { translateWithContext } from "@/lib/scanMessages";
import { usePopupStore, useStaffStore } from "@/stores";
import { GetUserCouponsResponse, Staff, StaffScanAssignmentItem } from "@/types/api";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

type StaffTab = "redeem" | "assign";

function ScanAssignmentHistoryList({ history, isLoading }: { history: StaffScanAssignmentItem[]; isLoading: boolean }) {
	if (isLoading) {
		return (
			<div className="mt-8 w-full max-w-[340px] space-y-3">
				<div className="mx-auto h-7 w-28 animate-pulse rounded-md bg-[var(--border-warm,#E8D5C0)]" />
				{[1, 2, 3].map(i => (
					<div key={i} className="animate-pulse rounded-xl bg-[var(--card-bg,#FFF8F0)] p-4 shadow-sm ring-1 ring-[var(--border-warm,#E8D5C0)]">
						<div className="h-4 w-24 rounded bg-[var(--border-warm,#E8D5C0)]" />
						<div className="mt-2 h-3 w-40 rounded bg-[var(--border-warm,#E8D5C0)]" />
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="mt-8 w-full max-w-[340px]">
			<h2 className="mb-4 text-center font-serif text-2xl font-bold text-[var(--text-primary)]">發放紀錄</h2>
			{history.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-8 text-center">
					<span className="text-4xl">🎁</span>
					<p className="font-serif text-lg text-[var(--text-secondary)]">尚無發放紀錄</p>
					<p className="text-sm text-[var(--text-secondary)]/60">掃描玩家的一次性 QR Code 開始發放</p>
				</div>
			) : (
				<ul className="space-y-3">
					{history.map((item, idx) => (
						<li key={`${item.user_id}-${item.created_at}-${idx}`} className="rounded-xl bg-[var(--card-bg,#FFF8F0)] px-4 py-3 shadow-sm ring-1 ring-[var(--border-warm,#E8D5C0)]">
							<div className="flex items-center justify-between gap-3">
								<span className="truncate font-serif font-bold text-[var(--text-primary)]">{item.nickname || "未知玩家"}</span>
								<span className="shrink-0 rounded-full bg-[#59360B]/10 px-2 py-1 text-xs font-medium text-[#59360B]">{item.discount_id}</span>
							</div>
							<div className="mt-1 text-right text-xs text-[var(--text-secondary)]">{new Date(item.created_at).toLocaleString()}</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function StaffScanContent() {
	const [activeTab, setActiveTab] = useState<StaffTab>("redeem");
	const [redeemScanStatus, setRedeemScanStatus] = useState<ScanStatus>({
		type: "idle"
	});
	const [assignScanStatus, setAssignScanStatus] = useState<ScanStatus>({
		type: "idle"
	});
	const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);
	const [scannedUserCouponToken, setScannedUserCouponToken] = useState<string | null>(null);
	const [lookupResult, setLookupResult] = useState<GetUserCouponsResponse | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const showPopup = usePopupStore(s => s.showPopup);

	// Staff store
	const { setStaffName, clearStaff } = useStaffStore();
	const attemptedTokenRef = useRef<string | null>(null);

	// API hooks
	const staffLogin = useStaffLogin();
	const staffLookupCoupons = useStaffLookupCoupons();
	const staffRedeemCoupon = useStaffRedeemCoupon();
	const staffAssignCouponByQRCode = useStaffAssignCouponByQRCode();
	const { data: redemptionHistory, isLoading: historyLoading } = useStaffRedemptionHistory();
	const { data: scanAssignmentHistory, isLoading: scanHistoryLoading } = useStaffScanAssignmentHistory();

	// ── 1. Read token from URL and login ──
	useEffect(() => {
		const tokenFromUrl = searchParams.get("token");
		if (tokenFromUrl) {
			if (attemptedTokenRef.current === tokenFromUrl) {
				return;
			}

			attemptedTokenRef.current = tokenFromUrl;
			scrubTokenFromCurrentUrl();
			staffLogin.mutate(tokenFromUrl, {
				onSuccess: (data: Staff) => {
					if (data?.name) setStaffName(data.name);
					setLoginErrorMessage(null);
					setRedeemScanStatus({ type: "idle" });
					setAssignScanStatus({ type: "idle" });
				},
				onError: error => {
					const message = translateWithContext("staff-login", error instanceof Error ? error.message : undefined, "工作人員登入失敗，請確認連結是否正確");
					setLoginErrorMessage(message);
					setRedeemScanStatus({ type: "error", message });
					setAssignScanStatus({ type: "error", message });
				}
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	// ── 2. Redeem flow: Handle QR scan → lookup coupons ──
	const handleRedeemScan = useCallback(
		(result: { rawValue: string }[]) => {
			if (!result.length) return;
			if (redeemScanStatus.type === "scanning" || staffLookupCoupons.isPending || staffRedeemCoupon.isPending) return;

			const userCouponToken = result[0].rawValue;
			setScannedUserCouponToken(userCouponToken);
			setRedeemScanStatus({ type: "scanning" });

			staffLookupCoupons.mutate(userCouponToken, {
				onSuccess: data => {
					setLookupResult(data);
					setRedeemScanStatus({ type: "idle" });
				},
				onError: error => {
					const apiMessage = error instanceof Error ? error.message : undefined;
					showPopup({
						title: "查詢失敗",
						description: apiMessage || "查詢折扣券失敗。可能的原因：玩家持個人 QR Code，請確認玩家切換至折價券專用兌換 QR Code。"
					});
					setRedeemScanStatus({ type: "idle" });
				}
			});
		},
		[redeemScanStatus, staffLookupCoupons, staffRedeemCoupon, showPopup]
	);

	// ── 3. Cancel lookup ──
	const handleCancelLookup = useCallback(() => {
		setLookupResult(null);
		setScannedUserCouponToken(null);
		setRedeemScanStatus({ type: "idle" });
	}, []);

	// ── 4. Redeem flow: Handle coupon redemption ──
	const handleConfirmRedeem = useCallback(() => {
		if (!scannedUserCouponToken || staffRedeemCoupon.isPending) return;

		setRedeemScanStatus({ type: "scanning" });

		staffRedeemCoupon.mutate(scannedUserCouponToken, {
			onSuccess: data => {
				setLookupResult(null);
				setScannedUserCouponToken(null);
				setRedeemScanStatus({ type: "idle" });

				showPopup({
					title: "核銷成功",
					description: `${data.user_name ? `玩家：${data.user_name}\n` : ""}共折抵 ${data.total} 元`
				});
			},
			onError: error => {
				const apiMessage = error instanceof Error ? error.message : undefined;
				setRedeemScanStatus({ type: "idle" });
				showPopup({
					title: "核銷失敗",
					description: apiMessage || "核銷失敗，請重試"
				});
			}
		});
	}, [scannedUserCouponToken, staffRedeemCoupon, showPopup]);

	// ── 5. Assign flow: Handle QR scan → assign fixed coupon ──
	const handleAssignScan = useCallback(
		(result: { rawValue: string }[]) => {
			if (!result.length) return;
			if (assignScanStatus.type === "scanning" || staffAssignCouponByQRCode.isPending) return;

			const userQRCode = result[0].rawValue;
			setAssignScanStatus({ type: "scanning" });

			staffAssignCouponByQRCode.mutate(userQRCode, {
				onSuccess: coupon => {
					setAssignScanStatus({ type: "success", message: "發放成功" });
					setTimeout(() => setAssignScanStatus({ type: "idle" }), 1200);

					showPopup({
						title: "發放成功",
						description: `已發放固定折價券 ${coupon.price} 元`
					});
				},
				onError: error => {
					const message = translateWithContext("staff-scan-assign", error instanceof Error ? error.message : undefined, "發放失敗，請確認玩家出示的是一次性 QR Code");

					setAssignScanStatus({ type: "error", message });
					setTimeout(() => setAssignScanStatus({ type: "idle" }), 1600);

					showPopup({
						title: "發放失敗",
						description: message
					});
				}
			});
		},
		[assignScanStatus, staffAssignCouponByQRCode, showPopup]
	);

	const currentScanStatus = activeTab === "redeem" ? redeemScanStatus : assignScanStatus;
	const currentOnScan = activeTab === "redeem" ? handleRedeemScan : handleAssignScan;

	return (
		<div className="flex flex-1 flex-col items-center px-6 py-8">
			{/* Title */}
			<h1 className="text-center font-serif text-3xl font-bold leading-snug text-[var(--text-primary)]">折價券工作台</h1>

			{/* Tab nav */}
			<nav className="mt-5 flex w-full max-w-[340px] gap-2">
				<button
					type="button"
					onClick={() => setActiveTab("redeem")}
					className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === "redeem" ? "bg-[var(--accent-bronze)] text-[var(--text-light)]" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
					}`}
				>
					掃描核銷
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("assign")}
					className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === "assign" ? "bg-[var(--accent-bronze)] text-[var(--text-light)]" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
					}`}
				>
					發放折價券
				</button>
			</nav>

			{/* Login error */}
			{(staffLogin.isError || loginErrorMessage) && (
				<div className="mt-4 w-full max-w-[340px] rounded-2xl bg-red-50 px-5 py-4 ring-1 ring-red-200">
					<div className="flex items-start gap-3">
						<span className="text-xl">⚠️</span>
						<div>
							<p className="font-serif font-bold text-red-800">登入失敗</p>
							<p className="mt-1 text-sm text-red-600">{loginErrorMessage || "工作人員登入失敗，請確認連結是否正確"}</p>
						</div>
					</div>
				</div>
			)}

			{activeTab === "redeem" ? (
				<p className="mt-3 max-w-[340px] text-center text-sm text-[var(--text-secondary)]">掃描玩家的折價券 QR Code，先查詢可用折價券後再進行核銷</p>
			) : (
				<p className="mt-3 max-w-[340px] text-center text-sm text-[var(--text-secondary)]">掃描玩家的一次性 QR Code，發放固定折價券（每位玩家僅能領取一次）</p>
			)}

			{/* Scanner area */}
			<div className="my-8">
				<QrScanner onScan={currentOnScan} scanStatus={currentScanStatus} />
			</div>

			{activeTab === "redeem" ? (
				<>
					{/* Lookup Result Card */}
					{lookupResult && <RedemptionCard lookupResult={lookupResult} onConfirmRedeem={handleConfirmRedeem} onCancel={handleCancelLookup} isRedeeming={staffRedeemCoupon.isPending} />}

					{/* Redemption History */}
					{!lookupResult && <RedemptionHistoryList history={redemptionHistory ?? []} isLoading={historyLoading} />}
				</>
			) : (
				<ScanAssignmentHistoryList history={scanAssignmentHistory ?? []} isLoading={scanHistoryLoading} />
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
				<span className="whitespace-nowrap font-serif text-lg font-bold text-[var(--text-primary)]">玩家 / 工作人員</span>
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
