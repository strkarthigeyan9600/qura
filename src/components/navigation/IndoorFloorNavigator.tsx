import React, { useState } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { MAP_NODES } from '../../data/mockData';
import { Search, Layers, Navigation, CheckCircle2, ChevronRight, DoorOpen } from 'lucide-react';

export const IndoorFloorNavigator: React.FC = () => {
    const {
        selectedBuilding,
        selectedFloor,
        setSelectedFloor,
        activeRoute,
        calculateRoute,
        clearRoute
    } = useNavigation();

    const [searchQuery, setSearchQuery] = useState('');

    const floorNodes = MAP_NODES.filter(
        node => node.buildingId === selectedBuilding.id && node.floorNumber === selectedFloor
    );

    const filteredNodes = searchQuery
        ? MAP_NODES.filter(
            n =>
                n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : floorNodes;

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
            {/* Left 2 Cols: Floor Visualizer */}
            <div className="lg:col-span-2 glass-panel bg-[#03140e]/95 border border-emerald-900/80 rounded-3xl p-6 flex flex-col shadow-2xl">
                {/* Floor Selection Tabs */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-emerald-900/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold text-white">{selectedBuilding.name} Destination Guide</h3>
                            <p className="text-xs text-emerald-300/70">Code: {selectedBuilding.code} | Total Floors: {selectedBuilding.floorCount}</p>
                        </div>
                    </div>

                    {/* Floor Level Selector */}
                    <div className="flex items-center gap-1.5 bg-[#02130c] p-1.5 rounded-2xl border border-emerald-900">
                        {Array.from({ length: selectedBuilding.floorCount }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedFloor(idx)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedFloor === idx
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-emerald-400/60 hover:text-emerald-200 hover:bg-emerald-950'
                                    }`}
                            >
                                {idx === 0 ? 'Ground' : `Floor ${idx}`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Indoor Floor Schematic Canvas */}
                <div className="relative w-full h-[400px] bg-[#020d08] rounded-2xl border border-emerald-900/80 p-6 overflow-hidden flex items-center justify-center">
                    {/* Floor Grid Outline */}
                    <div className="absolute inset-0 bg-[radial-gradient(#064e3b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

                    {/* Indoor Nodes Layout */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        {floorNodes.length === 0 && <p className="text-sm text-slate-400 text-center max-w-sm">Room information for this floor is not available yet. Search a destination or ask at the department office.</p>}
                        {floorNodes.map(node => {
                            const isStart = activeRoute?.fromNodeId === node.id;
                            const isTarget = activeRoute?.toNodeId === node.id;
                            const isPathNode = activeRoute?.path.some(p => p.id === node.id);

                            return (
                                <div
                                    key={node.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Navigate to ${node.name}`}
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); calculateRoute(node.id); } }}
                                    onClick={() => calculateRoute(node.id)}
                                    className={`absolute p-3 rounded-2xl border transition-all cursor-pointer shadow-lg flex flex-col items-center justify-center group ${isTarget
                                            ? 'bg-emerald-600/90 text-white border-emerald-300 scale-110 z-20'
                                            : isStart
                                                ? 'bg-amber-600/90 text-white border-amber-300 z-20'
                                                : isPathNode
                                                    ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/60 z-10'
                                                    : 'bg-[#041f15]/90 text-emerald-200 border-emerald-900/80 hover:border-emerald-500/50 hover:bg-emerald-900'
                                        }`}
                                    style={{
                                        left: `${node.x}%`,
                                        top: `${node.y}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <DoorOpen className={`w-4 h-4 ${isTarget ? 'text-amber-300' : 'text-emerald-400'}`} />
                                        <span className="text-xs font-extrabold">{node.code}</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-300/70 group-hover:text-emerald-100 mt-0.5 line-clamp-1 max-w-[120px] text-center font-medium">
                                        {node.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Col: Room Search & Step-by-Step Directions */}
            <div className="glass-panel bg-[#03140e]/95 border border-emerald-900/80 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
                <div>
                    {/* Room Finder Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                        <input
                            aria-label="Search rooms and destinations"
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Find room, cabin, or lab..."
                            className="w-full pl-10 pr-4 py-3 bg-[#02130c] border border-emerald-800/80 rounded-2xl text-sm text-white placeholder-emerald-400/50 focus:outline-none focus:border-amber-400 transition-colors"
                        />
                    </div>

                    <h4 className="text-sm font-extrabold text-emerald-300 mb-3 flex items-center justify-between">
                        <span>Room Directory</span>
                        <span className="text-xs text-amber-400 font-bold">{filteredNodes.length} Locations</span>
                    </h4>

                    {/* Room List Scroll */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                        {filteredNodes.length === 0 && <p role="status" className="text-xs text-slate-400 py-4">No matching destinations. Try a different search or floor.</p>}
                        {filteredNodes.map(node => {
                            const isSelected = activeRoute?.toNodeId === node.id;
                            return (
                                <div
                                    key={node.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Navigate to ${node.name}`}
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); calculateRoute(node.id); } }}
                                    onClick={() => calculateRoute(node.id)}
                                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                                            ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                                            : 'bg-[#02130c] border-emerald-900/60 text-slate-300 hover:bg-[#072d1f]'
                                        }`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white">{node.name}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-amber-300 font-mono border border-emerald-800">
                                                {node.code}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-emerald-300/70 mt-0.5">Floor {node.floorNumber} • {node.category.toUpperCase()}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-emerald-500" />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step-by-Step Directions Card */}
                {activeRoute && (
                    <div className="mt-6 pt-4 border-t border-emerald-900/60">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
                                <Navigation className="w-4 h-4 fill-amber-400" />
                                <span>Turn-by-Turn Instructions</span>
                            </h4>
                            <button onClick={clearRoute} className="text-xs text-rose-400 hover:underline">
                                Clear Route
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 text-xs scrollbar-thin">
                            {activeRoute.steps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2.5 p-2 bg-[#02130c] rounded-xl border border-emerald-900">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-white">{step.instruction}</p>
                                        <span className="text-[10px] text-amber-400 font-semibold">~{step.distanceMeters} meters</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
