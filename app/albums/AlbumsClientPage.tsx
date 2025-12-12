"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LastfmUserTopAlbum } from "@musicorum/lastfm/dist/types/packages/user";

type ExtendedAlbum = LastfmUserTopAlbum & { matchedType?: 'lp' | 'ep' };
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
    closestCenter,
} from "@dnd-kit/core";
import DraggableAlbumCard from "@/components/DraggableAlbumCard";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";

interface AlbumsClientPageProps {
    username: string;
    limit?: number;
    includeEPs?: boolean;
}

export default function AlbumsClientPage({ username, limit: initialLimit = 9, includeEPs: initialIncludeEPs = false }: AlbumsClientPageProps) {
    // Data fetching state
    const [cachedAlbums, setCachedAlbums] = useState<ExtendedAlbum[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [includeEPs, setIncludeEPs] = useState(initialIncludeEPs);
    const [hasLoadedEPs, setHasLoadedEPs] = useState(initialIncludeEPs);
    const fetchingRef = useRef(false);

    // Grid state
    const [gridSize, setGridSize] = useState<number>(initialLimit);

    // Initialize grid with the custom size logic, but here we just use the initialLimit
    const [gridAlbums, setGridAlbums] = useState<(ExtendedAlbum | null)[]>(
        Array(initialLimit).fill(null)
    );

    const [availableAlbums, setAvailableAlbums] = useState<ExtendedAlbum[]>([]);
    const [activeAlbum, setActiveAlbum] = useState<ExtendedAlbum | null>(null);

    // Filter available albums based on current toggle state
    useEffect(() => {
        if (includeEPs) {
            setAvailableAlbums(cachedAlbums);
        } else {
            setAvailableAlbums(cachedAlbums.filter(a => a.matchedType === 'lp'));
        }
    }, [cachedAlbums, includeEPs]);

    // Fetch albums from API
    // Fetch albums from API
    const fetchAlbums = useCallback(async (loadEPs: boolean) => {
        if (!username || fetchingRef.current) return;

        try {
            fetchingRef.current = true;
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({
                username: username,
            });

            // Only request EPs if explicitly asked
            params.append('includeEPs', loadEPs.toString());

            const response = await fetch(`/api/albums?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch albums');
            }

            const data = await response.json();

            setCachedAlbums(data.albums);
            if (loadEPs) setHasLoadedEPs(true);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [username]);

    // Initial fetch on username change
    useEffect(() => {
        // Reset state on new username
        setHasLoadedEPs(initialIncludeEPs);
        setCachedAlbums([]);
        // Fetch based on initial preference (likely false)
        // If initialIncludeEPs is true, we fetch true.
        // We use the initial prop here to decide the first fetch?
        // Or current state? Current state is initialized to prop.
        fetchAlbums(includeEPs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, fetchAlbums]); // Intentionally exclude includeEPs to avoid re-fetch on simple toggle

    // Handle Toggle ON to lazy load
    useEffect(() => {
        if (includeEPs && !hasLoadedEPs) {
            fetchAlbums(true);
        }
    }, [includeEPs, hasLoadedEPs, fetchAlbums]);

    // Clean up grid albums when includeEPs is turned off
    useEffect(() => {
        if (!includeEPs) {
            setGridAlbums(prevGrid =>
                prevGrid.map(album =>
                    // If album exists and is an EP, remove it (return null)
                    album?.matchedType === 'ep' ? null : album
                )
            );
        }
    }, [includeEPs]);

    // Theme detection
    const { theme } = useTheme();

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
            setActiveAlbum(active.data.current.album as ExtendedAlbum);
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
            const draggedAlbum = activeData?.album as ExtendedAlbum;

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

    // Export handler - Manual canvas approach to avoid lab() color issues
    const handleExport = async () => {
        try {
            // Determine colors based on theme
            const isDark = theme === 'dark';
            const bgColor = isDark ? '#000000' : '#ffffff';
            const textColor = isDark ? '#ffffff' : '#000000';
            const gridBorderColor = isDark ? '#666666' : '#333333';
            const cellBorderColor = isDark ? '#444444' : '#333333';
            const gridBgColor = isDark ? '#1a1a1a' : '#f5f5f5';

            const filledAlbums = gridAlbums
                .map((album, index) => ({ album, index }))
                .filter(({ album }) => album !== null);

            if (filledAlbums.length === 0) {
                alert("Please add some albums to the grid before exporting.");
                return;
            }

            // Calculate grid dimensions
            const sqrt = Math.sqrt(gridSize);
            const isSquare = Number.isInteger(sqrt);
            const columns = isSquare ? sqrt : (gridSize <= 5 ? gridSize : 5);
            const rows = Math.ceil(gridSize / columns);

            const cellSize = 200;
            const gridWidth = columns * cellSize;
            const gridHeight = rows * cellSize;
            const listWidth = 400;
            const padding = 40;

            const canvas = document.createElement('canvas');
            canvas.width = gridWidth + listWidth + padding * 3;
            canvas.height = Math.max(gridHeight, filledAlbums.length * 20 + 100) + padding * 2;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw grid background
            ctx.fillStyle = gridBgColor;
            ctx.fillRect(padding, padding, gridWidth, gridHeight);

            // Draw grid border
            ctx.strokeStyle = gridBorderColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(padding, padding, gridWidth, gridHeight);

            // Draw grid cells and load images
            const imagePromises: Promise<void>[] = [];
            const albumPositions: { x: number; y: number; index: number }[] = [];

            for (let i = 0; i < gridSize; i++) {
                const row = Math.floor(i / columns);
                const col = i % columns;
                const x = padding + col * cellSize;
                const y = padding + row * cellSize;

                // Cell border
                ctx.strokeStyle = cellBorderColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);

                const album = gridAlbums[i];
                if (album) {
                    const imageUrl = album.images && album.images.length > 0
                        ? album.images[album.images.length - 1].url
                        : null;

                    if (imageUrl) {
                        const promise = new Promise<void>((resolve) => {
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            img.onload = () => {
                                ctx.drawImage(img, x, y, cellSize, cellSize);
                                resolve();
                            };
                            img.onerror = () => resolve(); // Continue even if image fails
                            img.src = imageUrl;
                        });
                        imagePromises.push(promise);
                    }

                    // Store position for badge drawing later
                    albumPositions.push({ x, y, index: i });
                }
            }

            // Wait for all images to load
            await Promise.all(imagePromises);

            // Draw rank badges AFTER images are loaded
            albumPositions.forEach(({ x, y, index }) => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(x + 5, y + 5, 30, 20);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText((index + 1).toString(), x + 12, y + 19);
            });

            // Draw album list
            const listX = padding * 2 + gridWidth;
            const listY = padding;

            ctx.fillStyle = textColor;
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText('Album List (Grid Position)', listX, listY + 30);

            ctx.font = '14px sans-serif';
            filledAlbums.forEach(({ album, index }, i) => {
                const text = `${index + 1}. ${album!.name} - ${album!.artist.name}`;
                const maxWidth = listWidth - 20;
                let displayText = text;

                // Truncate if too long
                if (ctx.measureText(text).width > maxWidth) {
                    while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 0) {
                        displayText = displayText.slice(0, -1);
                    }
                    displayText += '...';
                }

                ctx.fillStyle = textColor;
                ctx.fillText(displayText, listX, listY + 70 + i * 20);
            });

            // Download
            const link = document.createElement('a');
            link.download = `topster-${gridSize}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Check console for details.");
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">
            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading albums...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-destructive mb-2">Error: {error}</p>
                        <p className="text-muted-foreground text-sm">Please try again later</p>
                    </div>
                </div>
            )}

            {!loading && !error && (
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    collisionDetection={closestCenter}
                >
                    {/* Left Side: Topster Grid */}
                    <div className="flex-1 bg-secondary/20 h-full overflow-auto block">
                        <div className="w-full min-h-full p-8 flex flex-col items-center justify-center space-y-4">

                            {/* Control Bar */}
                            <div className="bg-background/80 backdrop-blur rounded-lg border border-border p-2 flex flex-wrap gap-4 items-center justify-center md:justify-start mb-4">
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

                                <div className="flex items-center space-x-2 border-l pl-4 border-border/50">
                                    <Switch
                                        id="include-eps"
                                        checked={includeEPs}
                                        onCheckedChange={setIncludeEPs}
                                    />
                                    <Label htmlFor="include-eps" className="text-sm font-medium cursor-pointer">Include EPs</Label>
                                </div>

                                <Button onClick={handleExport} variant="outline" size="sm" className="ml-auto">
                                    Export Image
                                </Button>
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
            )}
        </div>
    );
}
