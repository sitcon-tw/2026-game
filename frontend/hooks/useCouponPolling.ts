"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { usePopupStore } from "@/stores";
import type { DiscountCoupon } from "@/types/api";

const STORAGE_KEY = "known-coupon-ids";
const POLL_INTERVAL = 3 * 60 * 1000; // 3 minutes

function getKnownIds(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function setKnownIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useCouponPolling() {
  const showPopup = usePopupStore((s) => s.showPopup);
  const isFirstLoad = useRef(true);

  const { data: coupons } = useQuery({
    queryKey: queryKeys.coupons.list,
    queryFn: () => api.get<DiscountCoupon[]>("/discount-coupons"),
    refetchInterval: POLL_INTERVAL,
  });

  useEffect(() => {
    if (!coupons) return;

    const currentIds = coupons.map((c) => c.id);
    const knownIds = getKnownIds();

    // First load (no cache): just store IDs, don't show popups
    if (knownIds === null || isFirstLoad.current) {
      setKnownIds(currentIds);
      isFirstLoad.current = false;
      return;
    }

    const knownSet = new Set(knownIds);
    const newCoupons = coupons.filter((c) => !knownSet.has(c.id));

    if (newCoupons.length > 0) {
      for (const coupon of newCoupons) {
        showPopup({
          title: "獲得新優惠券！",
          description: `恭喜獲得 ${coupon.price} 元折價券`,
          cta: { name: "查看優惠券", link: "/coupon" },
          doneText: "知道了",
        });
      }
      setKnownIds(currentIds);
    }
  }, [coupons, showPopup]);
}
