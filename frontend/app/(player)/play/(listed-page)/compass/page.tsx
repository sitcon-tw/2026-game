"use client";

import UserNamecardModal from "@/components/namecard/UserNamecardModal";
import QrScanner from "@/components/QrScanner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LocalQRCode from "@/components/ui/LocalQRCode";
import { useCurrentUser, useGroupCheckIn, useGroupMembers, useOneTimeQR } from "@/hooks/api";
import type { ScanStatus } from "@/lib/scanMessages";
import { translateWithContext } from "@/lib/scanMessages";
import type { GroupMember } from "@/types/api";
import { useCallback, useMemo, useState } from "react";

type CompassTab = "scan" | "members";

export default function CompassPage() {
	const [tab, setTab] = useState<CompassTab>("scan");
	const [scanStatus, setScanStatus] = useState<ScanStatus>({ type: "idle" });
	const [showMyQR, setShowMyQR] = useState(false);
	const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);

	const { data: currentUser, isLoading: userLoading } = useCurrentUser();
	const hasGroup = !!currentUser?.group;

	const { data: members, isLoading: membersLoading, isFetching: membersFetching } = useGroupMembers(hasGroup);
	const { data: oneTimeQR } = useOneTimeQR();
	const groupCheckIn = useGroupCheckIn();

	const checkedInCount = useMemo(() => (members ?? []).filter(member => member.checked_in).length, [members]);

	const handleScan = useCallback(
		(result: { rawValue: string }[]) => {
			if (!result.length) return;
			if (scanStatus.type === "scanning" || groupCheckIn.isPending) return;

			setScanStatus({ type: "scanning" });
			const userQRCode = result[0].rawValue;

			groupCheckIn.mutate(userQRCode, {
				onSuccess: () => {
					setScanStatus({
						type: "success",
						message: "指南針簽到成功！"
					});
					setTimeout(() => setScanStatus({ type: "idle" }), 2000);
				},
				onError: err => {
					const message = translateWithContext("group-checkin", err instanceof Error ? err.message : undefined, "指南針簽到失敗，請重試");
					setScanStatus({ type: "error", message });
					setTimeout(() => setScanStatus({ type: "idle" }), 3000);
				}
			});
		},
		[groupCheckIn, scanStatus]
	);

	if (userLoading) {
		return <LoadingSpinner />;
	}

	if (!hasGroup) {
		return (
			<div className="bg-[var(--bg-primary)] px-6 pt-8">
				<h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center mb-4">指南針計畫</h1>
				<p className="text-center font-serif text-[var(--text-secondary)] leading-relaxed">
					你目前沒有參與指南針計畫。
					<br />
					看到這個畫面代表你尚未分組。
				</p>
			</div>
		);
	}

	return (
		<div className="bg-[var(--bg-primary)] px-6 pt-6">
			<h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center">指南針計畫</h1>
			<p className="mt-2 text-center text-sm font-serif text-[var(--text-secondary)]">你的指南針小組：{currentUser.group}</p>

			<div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--bg-secondary)] p-2">
				<button
					type="button"
					onClick={() => setTab("scan")}
					className={`rounded-xl px-4 py-3 font-serif text-base font-semibold transition-colors ${tab === "scan" ? "bg-[var(--accent-bronze)] text-white" : "text-[var(--text-secondary)]"}`}
				>
					掃描簽到
				</button>
				<button
					type="button"
					onClick={() => setTab("members")}
					className={`rounded-xl px-4 py-3 font-serif text-base font-semibold transition-colors ${tab === "members" ? "bg-[var(--accent-bronze)] text-white" : "text-[var(--text-secondary)]"}`}
				>
					夥伴列表
				</button>
			</div>

			{tab === "scan" ? (
				<div className="mt-6 flex flex-col items-center">
					<QrScanner
						onScan={handleScan}
						scanStatus={scanStatus}
						showAlternate={showMyQR}
						alternateContent={
							<div className="flex h-full w-full items-center justify-center bg-[var(--bg-secondary)]">
								<div className="flex flex-col items-center gap-3 p-10">
									{oneTimeQR?.token ? (
										<div className="rounded-2xl bg-white p-3 shadow-md">
											<LocalQRCode value={oneTimeQR.token} size={192} ariaLabel="我的 QR Code" className="h-48 w-48 overflow-hidden rounded-md" />
										</div>
									) : (
										<div className="rounded-2xl bg-white p-3 shadow-md">
											<div className="h-48 w-48 animate-pulse rounded-md bg-[#6b6b6b]" />
										</div>
									)}
									<span className="text-sm text-[var(--text-secondary)]">讓指南針夥伴掃描你的 QR Code</span>
								</div>
							</div>
						}
					/>

					<p className="mt-5 text-center font-serif text-[var(--text-secondary)] leading-relaxed">
						掃描指南針夥伴的「我的 QR Code」完成簽到
						<br />
						每位夥伴只能互簽一次
					</p>

					<div className="mt-5 rounded-xl bg-[var(--bg-secondary)] px-5 py-3 text-center">
						<span className="font-serif text-[var(--text-secondary)]">目前進度 </span>
						<span className="font-serif font-semibold text-[var(--text-primary)]">
							{checkedInCount}/{members?.length ?? 0}
						</span>
					</div>

					<button
						type="button"
						onClick={() => setShowMyQR(prev => !prev)}
						className="mt-6 rounded-full bg-[var(--bg-header)] px-8 py-3 font-serif text-lg font-semibold text-[var(--text-light)] shadow-md transition-transform active:scale-95"
					>
						{showMyQR ? "切回掃描簽到" : "顯示我的 QR Code"}
					</button>
				</div>
			) : membersLoading && !members ? (
				<div className="mt-8">
					<LoadingSpinner />
				</div>
			) : (
				<div className="mt-6 space-y-3">
					{(members ?? []).length === 0 ? (
						<p className="text-center font-serif text-[var(--text-secondary)] mt-8">目前還沒有其他指南針夥伴。</p>
					) : (
						(members ?? []).map(member => (
							<button
								key={member.id}
								type="button"
								onClick={() => {
									if (member.id === currentUser?.id) return;
									setSelectedMember(member);
								}}
								className="flex w-full items-center gap-4 rounded-2xl bg-[var(--bg-secondary)] px-5 py-4 text-left shadow-sm"
							>
								{member.avatar ? (
									<img src={member.avatar} alt={member.nickname} className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
								) : (
									<div className="h-12 w-12 rounded-full bg-[var(--accent-bronze)] flex-shrink-0 flex items-center justify-center font-serif text-xl font-bold text-white">
										{member.nickname.charAt(0)}
									</div>
								)}

								<div className="min-w-0 flex-1">
									<p className="truncate font-serif font-semibold text-[var(--text-primary)]">{member.nickname}</p>
									<p className="text-sm text-[var(--text-secondary)]">第 {member.current_level} 關</p>
								</div>

								<span className={`rounded-full px-3 py-1 text-xs font-semibold ${member.checked_in ? "bg-green-500 text-white" : "bg-[rgba(93,64,55,0.15)] text-[var(--text-secondary)]"}`}>
									{member.checked_in ? "已簽到" : "未簽到"}
								</span>
							</button>
						))
					)}

					{membersFetching && <p className="text-center text-sm text-[var(--text-secondary)]">更新中...</p>}
				</div>
			)}

			<UserNamecardModal
				open={!!selectedMember}
				onClose={() => setSelectedMember(null)}
				user={
					selectedMember
						? {
								nickname: selectedMember.nickname,
								avatar: selectedMember.avatar,
								current_level: selectedMember.current_level,
								namecard: selectedMember.namecard
							}
						: null
				}
			/>
		</div>
	);
}
