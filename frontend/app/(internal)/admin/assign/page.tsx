"use client";

import { useState } from "react";
import { useAdminSearchUsers, useAdminAssignCoupon } from "@/hooks/api";
import type { User } from "@/types/api";
import { usePopupStore } from "@/stores";

function UserSearchResult({
  user,
  onSelect,
  selected,
}: {
  user: User;
  onSelect: (user: User) => void;
  selected: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(user)}
      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
        selected
          ? "bg-[var(--accent-bronze)]/20 ring-2 ring-[var(--accent-bronze)]"
          : "bg-[var(--bg-secondary)]"
      }`}
    >
      <div className="flex flex-col">
        <span className="text-sm font-bold text-[var(--text-primary)]">
          {user.nickname}
        </span>
        <span className="text-xs text-[var(--text-secondary)]">
          Lv.{user.current_level} | {user.id.slice(0, 8)}...
        </span>
      </div>
    </button>
  );
}

export default function AssignCouponPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [discountId, setDiscountId] = useState("");
  const [price, setPrice] = useState(0);

  const { data: users, isLoading: usersLoading } =
    useAdminSearchUsers(searchQuery);
  const assignCoupon = useAdminAssignCoupon();
  const showPopup = usePopupStore((s) => s.showPopup);

  const handleAssign = () => {
    const normalizedDiscountId = discountId.trim();
    if (!selectedUser || !normalizedDiscountId || price <= 0) return;

    assignCoupon.mutate(
      {
        user_id: selectedUser.id,
        discount_id: normalizedDiscountId,
        price,
      },
      {
        onSuccess: () => {
          showPopup({
            title: "指派成功",
            description: `已成功發放 $${price} 折價券給 ${selectedUser.nickname}`,
          });
          setSelectedUser(null);
          setDiscountId("");
          setPrice(0);
          setSearchQuery("");
        },
        onError: (error) => {
          showPopup({
            title: "指派失敗",
            description: `${error?.message ?? "未知錯誤"}，請重新整理頁面後再試`,
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-bold text-[var(--text-primary)]">
          搜尋玩家
        </h2>
        <input
          type="text"
          placeholder="輸入暱稱搜尋..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedUser(null);
          }}
          className="rounded-lg border-none bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
        />

        {usersLoading && searchQuery && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-[var(--bg-secondary)]"
              />
            ))}
          </div>
        )}

        {users && users.length === 0 && searchQuery && (
          <p className="text-sm text-[var(--text-secondary)]">找不到使用者</p>
        )}

        {users && users.length > 0 && (
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <UserSearchResult
                key={user.id}
                user={user}
                onSelect={setSelectedUser}
                selected={selectedUser?.id === user.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Assign form */}
      {selectedUser && (
        <div className="flex flex-col gap-3">
          <h2 className="font-serif text-lg font-bold text-[var(--text-primary)]">
            發放折價券給 {selectedUser.nickname}
          </h2>

          <input
            type="text"
            value={discountId}
            onChange={(e) => setDiscountId(e.target.value)}
            placeholder="輸入自訂 Discount ID"
            className="rounded-lg border-none bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-primary)]"
          />

          <input
            type="number"
            min={1}
            step={1}
            value={price === 0 ? "" : price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="輸入折價金額"
            className="rounded-lg border-none bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-primary)]"
          />

          <button
            onClick={handleAssign}
            disabled={
              assignCoupon.isPending || !discountId.trim() || price <= 0
            }
            className="rounded-full bg-[var(--accent-bronze)] py-3 text-sm font-bold text-[var(--text-light)] transition-transform active:scale-95 disabled:opacity-50"
          >
            {assignCoupon.isPending ? "指派中..." : "指派折價券"}
          </button>
        </div>
      )}
    </div>
  );
}
