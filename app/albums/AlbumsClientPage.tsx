"use client";

import { useState } from "react";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";
import TopsterGrid from "@/components/TopsterGrid";
import AlbumList from "@/components/AlbumList";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import DraggableAlbumCard from "@/components/DraggableAlbumCard";

interface AlbumsClientPageProps {
    initialAlbums: LastfmUserTopAlbum[];
    limit?: number;
}

export default function AlbumsClientPage({ initialAlbums, limit = 42 }: AlbumsClientPageProps) {
    // Grid state: Sparse array of albums or nulls
    const [gridAlbums, setGridAlbums] = useState<(LastfmUserTopAlbum | null)[]>(
        Array(limit).fill(null)
    );
    const [availableAlbums, setAvailableAlbums] = useState<LastfmUserTopAlbum[]>(initialAlbums);
    const [activeAlbum, setActiveAlbum] = useState<LastfmUserTopAlbum | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10, // Avoid accidental drags
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        // Retrieve album data stored in useDraggable
        if (active.data.current && active.data.current.album) {
            setActiveAlbum(active.data.current.album as LastfmUserTopAlbum);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveAlbum(null);

        if (!over) return;

        const activeData = active.data.current;
        // const overData = over.data.current; // Not strictly needed if we parse IDs

        // Source info
        const sourceSource = activeData?.source; // 'list' or 'grid'
        const sourceIndex = activeData?.index; // index in list or grid

        // Destination info
        const destId = over.id as string;

        // 1. Drop on Grid Slot
        if (destId.startsWith("topster-slot-")) {
            const destIndex = parseInt(destId.replace("topster-slot-", ""), 10);
            const draggedAlbum = activeData?.album as LastfmUserTopAlbum;

            if (!draggedAlbum) return;

            setGridAlbums((prev) => {
                const newGrid = [...prev];
                const existingInSlot = newGrid[destIndex];

                if (sourceSource === 'list') {
                    // List -> Grid
                    newGrid[destIndex] = draggedAlbum;
                } else if (sourceSource === 'grid' && typeof sourceIndex === 'number') {
                    // Grid -> Grid
                    if (existingInSlot) {
                        // Swap
                        newGrid[sourceIndex] = existingInSlot;
                        newGrid[destIndex] = draggedAlbum;
                    } else {
                        // Move to empty
                        newGrid[sourceIndex] = null;
                        newGrid[destIndex] = draggedAlbum;
                    }
                }
                return newGrid;
            });
        }
        // 2. Drop on Album List (Remove from Grid)
        else if (destId === 'album-list') {
            if (sourceSource === 'grid' && typeof sourceIndex === 'number') {
                setGridAlbums((prev) => {
                    const newGrid = [...prev];
                    newGrid[sourceIndex] = null;
                    return newGrid;
                });
            }

        }
    };

    // Derived state: Filter out albums that are already in the grid
    const filteredAvailableAlbums = availableAlbums.filter((album) => {
        return !gridAlbums.some((gridAlbum) =>
            gridAlbum &&
            gridAlbum.name === album.name &&
            gridAlbum.artist.name === album.artist.name
        );
    });

    return (
        <div className="flex h-screen overflow-hidden">
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Left Side: Topster Grid */}
                <div className="flex-1 bg-secondary/20 h-full overflow-y-auto block">
                    <div className="w-full min-h-full p-8 flex flex-col items-center justify-center">
                        <TopsterGrid albums={gridAlbums} limit={limit} />
                    </div>
                </div>

                {/* Right Side: Scrollable List (Filtered) */}
                <AlbumList albums={filteredAvailableAlbums} />

                {/* Drag Overlay (Portal) */}
                <DragOverlay zIndex={9999} dropAnimation={null}>
                    {activeAlbum ? (
                        <div style={{ width: 200, height: 200, cursor: 'grabbing' }}>
                            <DraggableAlbumCard
                                album={activeAlbum}
                                index={0}
                                coverOnly={true}
                                id="overlay-item"
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
