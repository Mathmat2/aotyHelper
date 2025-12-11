
import { useDroppable } from "@dnd-kit/core";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";
import DraggableAlbumCard from "./DraggableAlbumCard";

interface TopsterGridProps {
    albums: (LastfmUserTopAlbum | null)[];
    limit: number;
}

// Inner component for individual slot to use hook properly
function GridSlot({ index, album }: { index: number; album: LastfmUserTopAlbum | null }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `topster-slot-${index}`,
        data: { index, type: 'slot' }
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                w-full aspect-square border border-border relative flex items-center justify-center
                ${isOver ? "bg-accent/50" : "bg-card"}
            `}
        >
            {album ? (
                <DraggableAlbumCard
                    album={album}
                    index={index}
                    coverOnly={true}
                    id={`grid-${index}`}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground text-xl font-bold select-none pointer-events-none">
                        {index + 1}
                    </span>
                </div>
            )}
        </div>
    );
}

export default function TopsterGrid({ albums, limit }: TopsterGridProps) {
    // Calculate columns
    const sqrt = Math.sqrt(limit);
    const isSquare = Number.isInteger(sqrt);
    const columns = isSquare ? sqrt : (limit <= 5 ? limit : 5);

    return (
        <div className="bg-transparent p-0 rounded-none shadow-none border-none w-fit h-fit">
            <div
                className="grid gap-0 border-[4px] border-border bg-muted"
                style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(200px, 1fr))`
                }}
            >
                {Array.from({ length: limit }).map((_, index) => (
                    <GridSlot
                        key={index}
                        index={index}
                        album={albums[index]}
                    />
                ))}
            </div>
        </div>
    );
}
