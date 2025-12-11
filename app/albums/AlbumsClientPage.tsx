'use client'

import { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { LastfmUserTopAlbum } from '@musicorum/lastfm/dist/types/packages/user';
import AlbumList from '@/components/AlbumList';
import TopsterGrid from '@/components/TopsterGrid';

interface AlbumsClientPageProps {
    initialAlbums: LastfmUserTopAlbum[];
    limit: number;
}

export default function AlbumsClientPage({ initialAlbums, limit }: AlbumsClientPageProps) {
    // State for the "Available" list (initially all albums)
    const [availableAlbums, setAvailableAlbums] = useState<LastfmUserTopAlbum[]>(initialAlbums);

    // State for the "Topster" grid (initially empty slots)
    // We fill with nulls to represent empty slots
    const [gridAlbums, setGridAlbums] = useState<(LastfmUserTopAlbum | null)[]>(
        Array(limit).fill(null)
    );

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        // Dropped outside
        if (!destination) return;

        // Dropped in same place
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceId = source.droppableId;
        const destId = destination.droppableId;

        // HELPER: Extract slot index from "topster-slot-X"
        const getSlotIndex = (id: string) => parseInt(id.replace('topster-slot-', ''));

        // --- 1. LIST -> SLOT ---
        if (sourceId === 'album-list' && destId.startsWith('topster-slot-')) {
            const slotIndex = getSlotIndex(destId);
            const sourceList = Array.from(availableAlbums);
            const gridList = Array.from(gridAlbums);

            // Get the album being moved
            const [movedAlbum] = sourceList.splice(source.index, 1);

            // Check target slot
            const existingAlbumInSlot = gridList[slotIndex];

            // Place new album in slot
            gridList[slotIndex] = movedAlbum;

            // If slot was occupied, move the old one back to the list (at top? or end? let's do top/index 0)
            if (existingAlbumInSlot) {
                sourceList.unshift(existingAlbumInSlot);
            }

            setAvailableAlbums(sourceList);
            setGridAlbums(gridList);
        }

        // --- 2. SLOT -> SLOT (Swap or Move) ---
        else if (sourceId.startsWith('topster-slot-') && destId.startsWith('topster-slot-')) {
            const sourceIndex = getSlotIndex(sourceId);
            const destIndex = getSlotIndex(destId);

            const gridList = Array.from(gridAlbums);

            // Swap logic
            const sourceItem = gridList[sourceIndex];
            const destItem = gridList[destIndex];

            gridList[destIndex] = sourceItem;
            gridList[sourceIndex] = destItem;

            setGridAlbums(gridList);
        }

        // --- 3. SLOT -> LIST (Remove) ---
        else if (sourceId.startsWith('topster-slot-') && destId === 'album-list') {
            const slotIndex = getSlotIndex(sourceId);
            const gridList = Array.from(gridAlbums);
            const sourceList = Array.from(availableAlbums);

            const itemToRemove = gridList[slotIndex];
            if (!itemToRemove) return; // Should not happen

            // Clear slot
            gridList[slotIndex] = null;

            // Add to list
            sourceList.splice(destination.index, 0, itemToRemove);

            setGridAlbums(gridList);
            setAvailableAlbums(sourceList);
        }

        // --- 4. LIST -> LIST (Reorder) ---
        else if (sourceId === 'album-list' && destId === 'album-list') {
            const items = Array.from(availableAlbums);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);
            setAvailableAlbums(items);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <DragDropContext onDragEnd={onDragEnd}>
                {/* Left Side: Topster Grid */}
                <div className="flex flex-col flex-1 items-center p-8 bg-secondary/20 h-full overflow-y-auto">
                    <TopsterGrid albums={gridAlbums} limit={limit} />
                </div>

                {/* Right Side: Scrollable List */}
                <AlbumList albums={availableAlbums} />
            </DragDropContext>
        </div>
    );
}
