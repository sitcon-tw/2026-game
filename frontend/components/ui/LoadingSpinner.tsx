export default function LoadingSpinner({ fullPage = false }: { fullPage?: boolean }) {
    return (
        <div
            className={
                fullPage
                    ? "flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]"
                    : "flex items-center justify-center py-20"
            }
        >
            <div className="text-center">
                <div className="mb-4 inline-block animate-spin text-4xl text-[var(--text-gold)]">
                    ✦
                </div>
                <p className="text-sm text-[var(--text-secondary)]">載入中…</p>
            </div>
        </div>
    );
}
