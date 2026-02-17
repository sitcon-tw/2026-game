import { motion } from "motion/react";

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
                <motion.img
                    src="/assets/landing/album-cd.svg"
                    alt="Loading"
                    className="mb-4 inline-block w-16 h-16"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
                <p className="text-sm text-[var(--text-secondary)]">載入中…</p>
            </div>
        </div>
    );
}
