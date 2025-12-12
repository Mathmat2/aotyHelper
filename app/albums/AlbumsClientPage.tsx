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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

interface AlbumsClientPageProps {
    initialAlbums: LastfmUserTopAlbum[];
    limit?: number;
}

export default function AlbumsClientPage({ initialAlbums, limit: initialLimit = 9 }: AlbumsClientPageProps) {
    // Grid state
    const [gridSize, setGridSize] = useState<number>(initialLimit);

    // Initialize grid with the custom size logic, but here we just use the initialLimit
    const [gridAlbums, setGridAlbums] = useState<(LastfmUserTopAlbum | null)[]>(
        Array(initialLimit).fill(null)
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

    // Resize handler
    const handleSizeChange = (newSizeStr: string) => {
        const newSize = parseInt(newSizeStr, 10);
        setGridSize(newSize);
        setGridAlbums(prev => {
            if (newSize > prev.length) {
                // Grow: Add nulls
                return [...prev, ...Array(newSize - prev.length).fill(null)];
            } else {
                // Shrink: Slice
                // Warning: Dropping items if shrinking!
                // For now, simple slice is standard behavior.
                return prev.slice(0, newSize);
            }
        });
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Left Side: Topster Grid */}
                <div className="flex-1 bg-secondary/20 h-full overflow-y-auto block">
                    <div className="w-full min-h-full p-8 flex flex-col items-center justify-center space-y-4">

                        {/* Control Bar */}
                        <div className="bg-background/80 backdrop-blur rounded-lg border border-border p-2 flex gap-4 items-center mb-4">
                            <span className="text-sm font-medium">Grid Size:</span>
                            <Select
                                value={gridSize.toString()}
                                onValueChange={handleSizeChange}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="9">3x3 (9)</SelectItem>
                                    <SelectItem value="16">4x4 (16)</SelectItem>
                                    <SelectItem value="25">5x5 (25)</SelectItem>
                                    <SelectItem value="40">5x8 (40)</SelectItem>
                                    <SelectItem value="42">Topster (42)</SelectItem>
                                    <SelectItem value="49">7x7 (49)</SelectItem>
                                    <SelectItem value="100">10x10 (100)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <TopsterGrid albums={gridAlbums} limit={gridSize} />
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
