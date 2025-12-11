
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import DraggableAlbumCard from "./DraggableAlbumCard";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";
import { ModeToggle } from "./mode-toggle";
import { Input } from "./ui/input";

interface AlbumListProps {
    albums: LastfmUserTopAlbum[];
}

export default function AlbumList({ albums }: AlbumListProps) {
    const { setNodeRef } = useDroppable({
        id: 'album-list'
    });

    const [searchQuery, setSearchQuery] = useState("");

    const filteredAlbums = albums.filter((album) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            album.name.toLowerCase().includes(query) ||
            album.artist.name.toLowerCase().includes(query)
        );
    });

    return (
        <div className="w-[300px] border-l border-border h-[calc(100vh-40px)] flex flex-col bg-background">
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div
                ref={setNodeRef}
                className="flex-1 overflow-y-auto p-4 space-y-2"
            >
                {filteredAlbums.map((album, index) => (
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
