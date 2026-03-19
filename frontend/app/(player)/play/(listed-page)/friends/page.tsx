"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useFriendList } from "@/hooks/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import UpdateMyNamecardModal from "@/components/namecard/UpdateMyNamecardModal";
import UserNamecardModal from "@/components/namecard/UserNamecardModal";
import type { FriendPublicProfile } from "@/types/api";

const PAGE_SIZE = 5;

export default function FriendsPage() {
  const router = useRouter();
  const { data: friends, isFetching } = useFriendList();
  const { data: currentUser } = useCurrentUser();
  const [page, setPage] = useState(0);
  const [showUpdateNamecard, setShowUpdateNamecard] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendPublicProfile | null>(
    null,
  );

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
                className="rounded-2xl bg-[var(--bg-secondary)] shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelectedFriend(friend)}
                  className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left"
                >
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
                  <div className="flex min-w-0 flex-col">
                    <span className="font-serif font-semibold text-[var(--text-primary)] truncate">
                      {friend.nickname}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      第 {friend.current_level} 關
                    </span>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-[var(--text-secondary)]">
                    點擊看名牌
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="cursor-pointer rounded-full bg-[var(--bg-header)] px-5 py-2 font-serif font-semibold text-[var(--text-light)] shadow disabled:opacity-40 transition-transform active:scale-95"
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
              className="cursor-pointer rounded-full bg-[var(--bg-header)] px-5 py-2 font-serif font-semibold text-[var(--text-light)] shadow disabled:opacity-40 transition-transform active:scale-95"
            >
              下一頁
            </button>
          </div>
        </>
      )}

      {/* Scan button */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/scan")}
          className="cursor-pointer rounded-full bg-[var(--bg-header)] px-8 py-3 font-serif text-lg font-semibold text-[var(--text-light)] shadow-md transition-transform active:scale-95"
        >
          掃描好友 QRCode
        </button>

        <button
          type="button"
          onClick={() => setShowUpdateNamecard(true)}
          className="cursor-pointer rounded-full border border-[var(--bg-header)] bg-transparent px-8 py-3 font-serif text-base font-semibold text-[var(--bg-header)] shadow-sm transition-transform active:scale-95"
        >
          更新我的名牌
        </button>
      </div>

      <UpdateMyNamecardModal
        open={showUpdateNamecard}
        onClose={() => setShowUpdateNamecard(false)}
        nickname={currentUser?.nickname}
        avatar={currentUser?.avatar}
        initialBio={currentUser?.namecard_bio}
        initialLinks={currentUser?.namecard_links}
        initialEmail={currentUser?.namecard_email}
      />

      <UserNamecardModal
        open={!!selectedFriend}
        onClose={() => setSelectedFriend(null)}
        user={
          selectedFriend
            ? {
                nickname: selectedFriend.nickname,
                avatar: selectedFriend.avatar,
                current_level: selectedFriend.current_level,
                namecard: selectedFriend.namecard,
              }
            : null
        }
      />
    </div>
  );
}
