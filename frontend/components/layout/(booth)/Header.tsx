"use client";

export default function Header() {


    return (
        <header className="sticky top-0 z-40 h-[var(--header-height)] bg-[var(--bg-header)]">
            <div className="flex flex-col h-full justify-center">
                <div className="text-center">
                    <h1 className="text-3xl text-[var(--bg-primary)] font-serif font-bold">
                        SITCON 大地遊戲
                    </h1>

                </div>

            </div>
        </header >
    );
}
