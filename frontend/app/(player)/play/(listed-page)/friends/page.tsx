"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFriendList } from "@/hooks/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const PAGE_SIZE = 5;

export default function FriendsPage() {
  const router = useRouter();
  const { data: friends, isFetching } = useFriendList();
  const [page, setPage] = useState(0);

  if (isFetching) {
    return <LoadingSpinner />;
  }

  const total = friends?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageFriends = (friends ?? []).slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="bg-[var(--bg-primary)] px-6 py-6">
      {/* Title */}
      <h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center mb-6">
        好友列表
      </h1>

      {total === 0 ? (
        <p className="text-center font-serif text-[var(--text-secondary)] mt-10">
          還沒有好友，快去掃描 QR Code 認識新朋友吧！
        </p>
      ) : (
        <>
          {/* Friend list */}
          <ul className="flex flex-col gap-3">
            {pageFriends.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center gap-4 rounded-2xl bg-[var(--bg-secondary)] px-5 py-4 shadow-sm"
              >
                {/* Avatar */}
                {friend.avatar ? (
                  <img
                    src={friend.avatar}
                    alt={friend.nickname}
                    className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[var(--accent-bronze)] flex-shrink-0 flex items-center justify-center font-serif text-xl font-bold text-white">
                    {friend.nickname.charAt(0)}
                  </div>
                )}
                {/* Info */}
                <div className="flex flex-col min-w-0">
                  <span className="font-serif font-semibold text-[var(--text-primary)] truncate">
                    {friend.nickname}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    第 {friend.current_level} 關
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full bg-[var(--bg-header)] px-5 py-2 font-serif font-semibold text-[var(--text-light)] shadow disabled:opacity-40 transition-transform active:scale-95"
            >
              上一頁
            </button>
            <span className="font-serif text-[var(--text-secondary)] text-sm">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full bg-[var(--bg-header)] px-5 py-2 font-serif font-semibold text-[var(--text-light)] shadow disabled:opacity-40 transition-transform active:scale-95"
            >
              下一頁
            </button>
          </div>
        </>
      )}

      {/* Scan button */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => router.push("/scan")}
          className="rounded-full bg-[var(--bg-header)] px-8 py-3 font-serif text-lg font-semibold text-[var(--text-light)] shadow-md transition-transform active:scale-95"
        >
          掃描好友 QRCode
        </button>
      </div>
    </div>
  );
}
