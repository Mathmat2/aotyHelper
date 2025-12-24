
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import DraggableAlbumCard from "./DraggableAlbumCard";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";
import { ModeToggle } from "./mode-toggle";
import { Input } from "./ui/input";

interface AlbumListProps {
    albums: LastfmUserTopAlbum[];
    width?: number;
    mobileHeight?: string; // e.g. "40vh"
    isDesktop?: boolean;
}

export default function AlbumList({ albums, width = 300, mobileHeight = "40vh", isDesktop = true }: AlbumListProps) {
    const { setNodeRef } = useDroppable({
        id: 'album-list'
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [visibleCount, setVisibleCount] = useState(50);

    const filteredAlbums = albums.filter((album) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            album.name.toLowerCase().includes(query) ||
            album.artist.name.toLowerCase().includes(query)
        );
    });

    // Reset visible count when search query changes
    if (searchQuery && visibleCount !== 50 && filteredAlbums.length <= 50) {
        // logic handled in effect or simply let it be dynamic
    }

    // Better: use effect to reset when search changes
    // But direct render logic is fine if we slice.

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight * 1.5) {
            setVisibleCount(prev => Math.min(prev + 50, filteredAlbums.length));
        }
    };

    const visibleAlbums = filteredAlbums.slice(0, visibleCount);

    return (
        <div
            className="w-full md:h-full border-t md:border-t-0 md:border-l border-border flex flex-col bg-background flex-shrink-0 transition-opacity duration-0 ease-linear"
            style={{
                width: isDesktop ? width : '100%',
                height: isDesktop ? '100%' : mobileHeight
            }}
        >
            <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold">Available Albums</h2>
                        <p className="text-xs text-muted-foreground">Drag to the grid</p>
                    </div>
                    <ModeToggle />
                </div>
                <Input
                    placeholder="Search albums..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setVisibleCount(50); // Reset visible count on search
                    }}
                />
            </div>
            <div
                ref={setNodeRef}
                className="flex-1 overflow-y-auto p-4 space-y-2"
                onScroll={handleScroll}
            >
                {visibleAlbums.map((album, index) => (
                    <DraggableAlbumCard
                        key={`${album.name}-${album.artist.name}`}
                        id={`list-${album.name}-${album.artist.name}`} // Unique ID for list items
                        album={album}
                        index={index}
                        coverOnly={false}
                    />
                ))}
            </div>
        </div>
    );
}
