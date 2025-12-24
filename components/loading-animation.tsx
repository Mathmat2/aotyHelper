"use client"

import Image from "next/image"

export default function LoadingAnimation() {
    return (
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
    )
}
