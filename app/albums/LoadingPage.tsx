import { BeatLoader } from 'react-spinners'

export default function LoadingPage() {
  return (
    <div className="w-full h-full flex items-center justify-center min-h-[50vh]">
      <BeatLoader color="#2d2d2d" />
    </div>
  )
}