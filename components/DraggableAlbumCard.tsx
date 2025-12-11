import { Draggable } from "@hello-pangea/dnd";
import Image from "next/image";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";

interface DraggableAlbumCardProps {
    album: LastfmUserTopAlbum;
    index: number;
    coverOnly?: boolean;
}

export default function DraggableAlbumCard({ album, index, coverOnly = false }: DraggableAlbumCardProps) {
    // Find the largest image (usually the last one in the array)
    const imageUrl = album.images && album.images.length > 0
        ? album.images[album.images.length - 1].url
        : "/placeholder.png"; // Fallback if no image

    // Unique ID for the draggable item
    const draggableId = `${album.name}-${album.artist.name}`;

    return (
        <Draggable draggableId={draggableId} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{ ...provided.draggableProps.style }}
                    className={ // Dynamic class based on mode
                        coverOnly
                            ? `relative w-full h-full overflow-hidden group
                           ${snapshot.isDragging ? "ring-2 ring-primary z-50" : ""}`
                            : `flex flex-col items-center p-2 bg-card rounded-md border border-border shadow-sm
                           ${snapshot.isDragging ? "" : "hover:bg-muted/50"}`
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
                            <div className="relative w-24 h-24 mb-2 overflow-hidden rounded-md">
                                {imageUrl ? (
                                    <Image src={imageUrl} alt={album.name} fill className="object-cover" sizes="96px" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                                )}
                                {/* Rank Badge (Optional in List? Usually not needed if not ranked, but index is passed... wait, list index is arbitrary for dragging) 
                                    Actually, index in list is just position. We probably don't want rank badge in the sidebar list.
                                    Let's valid check: index is passed from map. In list, index = 0, 1, 2...
                                    Sidebar usually doesn't show rank? 
                                    I'll HIDE rank in standard mode as per "Only covers" usually implies the grid is the ranked part.
                                */}
                            </div>
                            <div className="text-center w-full">
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
            )}
        </Draggable>
    );
}
