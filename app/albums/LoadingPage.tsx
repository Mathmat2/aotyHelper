import { BeatLoader } from 'react-spinners'

export default function LoadingPage() {
  // Or a custom loading skeleton component
  return (<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          {<BeatLoader />}
        </main>
      </div>)
}