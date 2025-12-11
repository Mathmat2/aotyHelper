
import { useDroppable } from "@dnd-kit/core";
import DraggableAlbumCard from "./DraggableAlbumCard";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";

interface AlbumListProps {
    albums: LastfmUserTopAlbum[];
}

export default function AlbumList({ albums }: AlbumListProps) {
    const { setNodeRef } = useDroppable({
        id: 'album-list'
    });

    return (
        <div className="w-[300px] border-l border-border h-[calc(100vh-40px)] flex flex-col bg-background">
            <div className="p-4 border-b border-border">
                <h2 className="font-semibold">Available Albums</h2>
                <p className="text-xs text-muted-foreground">Drag to the grid</p>
            </div>
            <div
                ref={setNodeRef}
                className="flex-1 overflow-y-auto p-4 space-y-2"
            >
                {albums.map((album, index) => (
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
