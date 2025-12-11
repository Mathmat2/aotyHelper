"use client"

import Image from "next/image"

export default function LoadingAnimation() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 min-h-[50vh]">
            <div className="relative animate-pulse">
                <Image
                    src="/aoty-logo.png"
                    alt="Loading..."
                    width={100}
                    height={100}
                    className="object-contain"
                    priority
                />
            </div>
            <p className="text-muted-foreground text-sm animate-pulse">Loading...</p>
        </div>
    )
}
