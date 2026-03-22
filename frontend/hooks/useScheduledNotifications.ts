"use client";

import { usePopupStore } from "@/stores";
import { useEffect, useRef } from "react";

const STORAGE_KEY = "shown-scheduled-notifications";
const CHECK_INTERVAL = 30 * 1000; // 30 seconds
/** Event date: 2026-03-28 GMT+8 */
const EVENT_DATE = "2026-03-28";

interface ScheduledNotification {
	id: string;
	/** "HH:MM" in 24-hour format (GMT+8) */
	time: string;
	title: string;
	description: string;
	cta?: { name: string; link: string };
}

const NOTIFICATIONS: ScheduledNotification[] = [
	{
		id: "flash-start",
		time: "10:00",
		title: "限時動態或貼文分享開始！",
		description: "限時動態或貼文分享已經開始囉，記得 tag #SITCON2026！",
		cta: { name: "查看攤位", link: "/play/booths" }
	},
	{
		id: "flash-30min-left",
		time: "11:30",
		title: "限時動態或貼文分享剩 30 分鐘",
		description: "限時動態或貼文分享將在 12:00 截止，把握最後機會分享並 tag #SITCON2026！",
		cta: { name: "查看攤位", link: "/play/booths" }
	},
	{
		id: "flash-end",
		time: "12:00",
		title: "限時動態或貼文分享已截止",
		description: "限時動態或貼文分享時間已結束。"
	},
	{
		id: "leaderboard-20min",
		time: "15:40",
		title: "排行榜即將結算",
		description: "排行榜將於 16:00 結算，把握最後時間衝刺！",
		cta: { name: "查看排行榜", link: "/leaderboard" }
	},
	{
		id: "leaderboard-5min",
		time: "15:55",
		title: "排行榜即將結算",
		description: "排行榜將於 16:00 結算，只剩 5 分鐘！",
		cta: { name: "查看排行榜", link: "/leaderboard" }
	},
	{
		id: "leaderboard-end",
		time: "16:00",
		title: "排行榜已結算",
		description: "16:00 後依然可以遊玩，但不會再獲得新的折價券。請記得在 16:30 前使用完畢折價券！",
		cta: { name: "查看折價券", link: "/coupon" }
	}
];

function getShownIds(): Set<string> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
	} catch {
		return new Set();
	}
}

function addShownId(id: string) {
	const shown = getShownIds();
	shown.add(id);
	localStorage.setItem(STORAGE_KEY, JSON.stringify([...shown]));
}

/** Build a Date for EVENT_DATE at the given HH:MM in GMT+8 */
function eventTime(time: string): Date {
	return new Date(`${EVENT_DATE}T${time}:00+08:00`);
}

function isEventDay(): boolean {
	const now = new Date();
	// Format current date in GMT+8
	const gmt8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
	const dateStr = gmt8.toISOString().slice(0, 10);
	return dateStr === EVENT_DATE;
}

export function useScheduledNotifications() {
	const showPopup = usePopupStore(s => s.showPopup);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		function check() {
			if (!isEventDay()) return;

			const now = new Date();
			const shown = getShownIds();

			for (const notif of NOTIFICATIONS) {
				if (shown.has(notif.id)) continue;
				if (now >= eventTime(notif.time)) {
					showPopup({
						title: notif.title,
						description: notif.description,
						cta: notif.cta,
						doneText: "知道了"
					});
					addShownId(notif.id);
				}
			}
		}

		// Check immediately on mount
		check();

		intervalRef.current = setInterval(check, CHECK_INTERVAL);
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [showPopup]);
}
