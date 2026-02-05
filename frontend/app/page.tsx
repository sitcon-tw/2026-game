import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[url('/assets/landing/background.png')] bg-top bg-cover text-[var(--text-primary)] max-w-lg mx-auto">
      <main className="mx-auto grid min-h-dvh grid-rows-grid-rows-[auto_1fr_auto_auto] px-6 py-6">
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-[500px]">
            <Image
              src="/assets/landing/message.png"
              alt="訊息框"
              width={500}
              height={90}
              priority
              className="h-auto w-full"
            />
            <div className="pointer-events-none absolute inset-y-0 left-20 md:left-26 right-6 flex items-center translate-y-[-4px] md:translate-y-[-8px]">
              <div className="h-8 w-full whitespace-nowrap text-[clamp(0.875rem,2.8vw,1.125rem)]">
                {/* rounded-full border border-dashed border-[#5d4037]/50 */}
                點選「開始」進入遊戲👇👇
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
          <Image
            src="/assets/landing/poster.png"
            alt="SITCON 大地遊戲"
            width={320}
            height={460}
            priority
          />
          <Image
            src="/assets/landing/player-controller.png"
            alt="Player controller"
            width={240}
            height={40}
          />
          <Image
            src="/assets/landing/player-timeline.png"
            alt="Player timeline"
            width={320}
            height={44}
          />
        </div>

        <div className="mt-8 flex items-center justify-center">
          <Link href="/levels" className="block">
            <Image
              src="/assets/landing/enter.png"
              alt="進入遊戲"
              width={180}
              height={64}
            />
          </Link>
        </div>

        <div className="grid grid-cols-[auto_1fr] items-end gap-3">
          <Image
            src="/assets/landing/note.png"
            alt="音符"
            width={48}
            height={60}
          />
          <div className="flex justify-end">
            <Image
              src="/assets/landing/stars.png"
              alt="Stars"
              width={140}
              height={60}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
