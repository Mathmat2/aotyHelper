import { Droppable } from "@hello-pangea/dnd";
import DraggableAlbumCard from "./DraggableAlbumCard";
import { ModeToggle } from "./mode-toggle";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";

interface AlbumListProps {
    albums: LastfmUserTopAlbum[];
}

export default function AlbumList({ albums }: AlbumListProps) {
    return (
        <div className="w-[300px] border-l border-border h-[calc(100vh-40px)] flex flex-col bg-background">
            <div className="p-4 border-b border-border flex justify-between items-center">
                <div>
                    <h2 className="font-semibold">Available Albums</h2>
                    <p className="text-xs text-muted-foreground">Drag to the grid</p>
                </div>
                <ModeToggle />
            </div>
            <Droppable droppableId="album-list">
                {/* isDropDisabled=true because we don't want to drop things back into the list, 
            or maybe we do if we want to remove them from the grid? 
            For now let's assume one-way or just copying?
            Wait, standard implementation usually moves items. 
            If I drag from list to grid, usually it moves.
            So I should allow dropping back to list if I want "move" behavior.
            Let's allow dropping back.
        */}
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 overflow-y-auto p-4 space-y-2"
                    >
                        {albums.map((album, index) => (
                            <DraggableAlbumCard
                                key={`${album.name}-${album.artist.name}`}
                                album={album}
                                index={index}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
