
import { useDroppable } from "@dnd-kit/core";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";
import DraggableAlbumCard from "./DraggableAlbumCard";

interface TopsterGridProps {
    albums: (LastfmUserTopAlbum | null)[];
    limit: number;
    isExportMode?: boolean;
}

// Inner component for individual slot to use hook properly
function GridSlot({ index, album, isExportMode }: { index: number; album: LastfmUserTopAlbum | null; isExportMode?: boolean }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `topster-slot-${index}`,
        data: { index, type: 'slot' }
    });

    if (isExportMode) {
        // Export mode: use inline styles to avoid lab() colors
        return (
            <div
                style={{
                    width: '100%',
                    aspectRatio: '1',
                    border: '1px solid #333333',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: album ? 'transparent' : '#ffffff'
                }}
            >
                {album ? (
                    <DraggableAlbumCard
                        album={album}
                        index={index}
                        coverOnly={true}
                        id={`grid-export-${index}`}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#666666', fontSize: '1.25rem', fontWeight: 'bold', userSelect: 'none', pointerEvents: 'none' }}>
                            {index + 1}
                        </span>
                    </div>
                )}
            </div>
        );
    }

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

export default function TopsterGrid({ albums, limit, isExportMode = false }: TopsterGridProps) {
    // Calculate columns
    const sqrt = Math.sqrt(limit);
    const isSquare = Number.isInteger(sqrt);
    const columns = isSquare ? sqrt : (limit <= 5 ? limit : 5);

    if (isExportMode) {
        // Export mode: use inline styles
        return (
            <div style={{ backgroundColor: 'transparent', padding: 0, borderRadius: 0, boxShadow: 'none', border: 'none', width: 'fit-content', height: 'fit-content' }}>
                <div
                    style={{
                        display: 'grid',
                        gap: 0,
                        border: '4px solid #333333',
                        backgroundColor: '#f5f5f5',
                        gridTemplateColumns: `repeat(${columns}, minmax(200px, 1fr))`
                    }}
                >
                    {Array.from({ length: limit }).map((_, index) => (
                        <GridSlot
                            key={index}
                            index={index}
                            album={albums[index]}
                            isExportMode={true}
                        />
                    ))}
                </div>
            </div>
        );
    }

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
