"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminLogin } from "@/hooks/api";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminLogin = useAdminLogin();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;

    adminLogin.mutate(token, {
      onSuccess: () => {
        router.replace("/admin/gift-coupons");
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
      <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)]">
        Admin
      </h1>

      {adminLogin.isPending && (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          登入中...
        </p>
      )}

      {adminLogin.isError && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-center text-sm text-red-700">
          登入失敗，請確認連結是否正確
        </div>
      )}

      {adminLogin.isSuccess && (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          登入成功，正在跳轉...
        </p>
      )}

      {!searchParams.get("token") && !adminLogin.isPending && (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          請使用包含 token 的連結進入
        </p>
      )}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <p className="text-lg text-[var(--text-primary)]">載入中...</p>
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
