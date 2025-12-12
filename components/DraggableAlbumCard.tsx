import { useDraggable } from "@dnd-kit/core";
import Image from "next/image";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";

interface DraggableAlbumCardProps {
    album: LastfmUserTopAlbum;
    index: number; // Keep index for rank visual, but not for ID
    coverOnly?: boolean;
    id: string; // Explicit ID required for dnd-kit
}

export default function DraggableAlbumCard({ album, index, coverOnly = false, id }: DraggableAlbumCardProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: id,
        data: { album, index, source: coverOnly ? 'grid' : 'list' } // Pass data for drag events
    });

    // Find the largest image (usually the last one in the array)
    const imageUrl = album.images && album.images.length > 0
        ? album.images[album.images.length - 1].url
        : "/placeholder.png"; // Fallback if no image

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            // If dragging, we can hide the original or style it. 
            // Usually dnd-kit keeps the original in place but we want it to "move".
            // So we might hide it if isDragging is true (and let Overlay handle the visual).
            // But for now let's just use opacity.
            className={ // Dynamic class based on mode
                coverOnly
                    ? `relative w-full h-full overflow-hidden group touch-manipulation select-none
                   ${isDragging ? "opacity-30" : ""}`
                    : `flex flex-col items-center p-2 bg-card rounded-md border border-border shadow-sm touch-manipulation select-none
                   ${isDragging ? "opacity-30" : "hover:bg-muted/50"}`
            }
        >
            {coverOnly ? (
                // Cover Only Mode
                <>
                    {imageUrl ? (
                        <Image src={imageUrl} alt={album.name} fill className="object-cover" sizes="200px" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-xs">No Image</div>
                    )}
                    {/* Rank Badge */}
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm z-10">
                        {index + 1}
                    </div>
                    {/* Hover Overlay Info */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center pointer-events-none">
                        <div>
                            <p className="text-white text-[10px] font-bold">{album.name}</p>
                            <p className="text-white/80 text-[10px]">{album.artist.name}</p>
                        </div>
                    </div>
                </>
            ) : (
                // Standard Mode
                <>
                    <div className="relative w-24 h-24 mb-2 overflow-hidden rounded-md pointer-events-none">
                        {imageUrl ? (
                            <Image src={imageUrl} alt={album.name} fill className="object-cover" sizes="96px" />
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                        )}
                    </div>
                    <div className="text-center w-full pointer-events-none">
                        <h3 className="text-xs font-semibold truncate w-full" title={album.name}>
                            {album.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground truncate w-full" title={album.artist.name}>
                            {album.artist.name}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
