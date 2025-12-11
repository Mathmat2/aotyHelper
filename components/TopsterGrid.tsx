import { Droppable, Draggable } from "@hello-pangea/dnd";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";

interface TopsterGridProps {
    albums: (LastfmUserTopAlbum | null)[]; // Array representing grid slots
    limit: number;
}

import DraggableAlbumCard from "./DraggableAlbumCard";

export default function TopsterGrid({ albums, limit }: TopsterGridProps) {

    // Calculate columns: if limit is a perfect square, use sqrt. Otherwise default to 5 (or limit if < 5)
    // Examples: 9 -> 3 cols. 10 -> 5 cols. 16 -> 4 cols. 25 -> 5 cols. 42 -> 5 cols. 100 -> 10 cols.
    const sqrt = Math.sqrt(limit);
    const isSquare = Number.isInteger(sqrt);
    // Ensure 3x3 for limit 9, etc.
    const columns = isSquare ? sqrt : (limit <= 5 ? limit : 5);

    return (
        <div className="flex-1 p-8 overflow-y-auto h-full bg-neutral-900 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-4">My Top Albums</h2>
            {/* Grid Container */}
            <div className="bg-transparent p-0 rounded-none shadow-none border-none w-fit h-fit">
                {/* Outer container is just the grid now, no single Droppable */}
                <div
                    className={`
                        grid gap-0 border-[4px] border-[#1d1d1d] bg-[#1d1d1d]
                    `}
                    style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(200px, 1fr))`
                    }}
                >
                    {Array.from({ length: limit }).map((_, index) => {
                        const album = albums[index];
                        // Each slot is a valid drop target
                        return (
                            <Droppable key={index} droppableId={`topster-slot-${index}`} isDropDisabled={false}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`
                                            w-full aspect-square border border-[#2a2a2a] relative flex items-center justify-center
                                            ${snapshot.isDraggingOver ? "bg-[#333]" : "bg-[#1d1d1d]"}
                                        `}
                                    >
                                        {album ? (
                                            <Draggable
                                                key={`${album.name}-${album.artist.name}`}
                                                draggableId={`${album.name}-${album.artist.name}`}
                                                index={0} // Index is always 0 in a single-slot droppable
                                            >
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="w-full h-full"
                                                        style={{ ...provided.draggableProps.style }}
                                                    >
                                                        <DraggableAlbumCard
                                                            album={album}
                                                            index={index} // Visual index only (for rank badge)
                                                            coverOnly={true}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ) : (
                                            // Empty Slot Placeholder
                                            <span className="text-[#333] text-xl font-bold select-none pointer-events-none group-hover:text-[#444] transition-colors">
                                                {index + 1}
                                            </span>
                                        )}
                                        {/* Placeholder for the item being dragged over */}
                                        <div className="hidden">
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
