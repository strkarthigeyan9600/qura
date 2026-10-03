import React, { createContext, useContext, useState, useEffect } from 'react';
import { Building, NavigationRoute, MapNode } from '../types';
import { BUILDINGS, MAP_NODES } from '../data/mockData';
import { NavigationGraphService } from '../services/navigationGraph';

interface NavigationContextType {
    selectedBuilding: Building;
    selectedFloor: number;
    startNodeId: string;
    setStartLocation: (buildingId: string) => void;
    targetNodeId: string | null;
    activeRoute: NavigationRoute | null;
    accessibleOnly: boolean;
    isQRModalOpen: boolean;
    setSelectedBuilding: (bldg: Building) => void;
    setSelectedFloor: (floor: number) => void;
    setTargetDestination: (buildingId: string, nodeId?: string) => void;
    calculateRoute: (toNodeId: string) => void;
    clearRoute: () => void;
    toggleAccessibleRoute: () => void;
    setQRModalOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedBuilding, setSelectedBuilding] = useState<Building>(BUILDINGS[0]);
    const [selectedFloor, setSelectedFloor] = useState<number>(0);
    const [startNodeId, setStartNodeId] = useState<string>(() => { const from = new URLSearchParams(window.location.search).get('from'); return MAP_NODES.some(n => n.id === from) ? from! : 'n-gate-kiosk'; });
    const setStartLocation = (buildingId: string) => { const node = MAP_NODES.find(n => n.buildingId === buildingId); if (node) setStartNodeId(node.id); };
    const [targetNodeId, setTargetNodeId] = useState<string | null>(() => {
        const target = new URLSearchParams(window.location.search).get('to');
        return MAP_NODES.some(n => n.id === target) ? target : null;
    });
    const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null);
    const [accessibleOnly, setAccessibleOnly] = useState<boolean>(false);
    const [isQRModalOpen, setQRModalOpen] = useState<boolean>(false);

    // Recalculate route whenever targetNodeId or accessibleOnly changes
    useEffect(() => {
        const node = MAP_NODES.find(n => n.id === targetNodeId);
        if (node) { const building = BUILDINGS.find(b => b.id === node.buildingId); if (building) setSelectedBuilding(building); setSelectedFloor(node.floorNumber); }
    }, [targetNodeId]);
    useEffect(() => {
        if (targetNodeId) {
            const route = NavigationGraphService.findRoute(startNodeId, targetNodeId, accessibleOnly);
            setActiveRoute(route);
        } else {
            setActiveRoute(null);
        }
    }, [targetNodeId, accessibleOnly, startNodeId]);

    const setTargetDestination = (buildingId: string, nodeId?: string) => {
        const bldg = BUILDINGS.find(b => b.id === buildingId) || BUILDINGS[0];
        setSelectedBuilding(bldg);

        if (nodeId) {
            setTargetNodeId(nodeId);
            const targetNode = MAP_NODES.find(n => n.id === nodeId);
            if (targetNode) {
                setSelectedFloor(targetNode.floorNumber);
            }
        } else {
            // Pick first entrance or main node in building
            const bldgNode = MAP_NODES.find(n => n.buildingId === buildingId);
            if (bldgNode) {
                setTargetNodeId(bldgNode.id);
                setSelectedFloor(bldgNode.floorNumber);
            }
        }
    };

    const calculateRoute = (toNodeId: string) => {
        setTargetNodeId(toNodeId);
    };

    const clearRoute = () => {
        setTargetNodeId(null);
        setActiveRoute(null);
    };

    const toggleAccessibleRoute = () => {
        setAccessibleOnly(prev => !prev);
    };

    return (
        <NavigationContext.Provider
            value={{
                selectedBuilding,
                selectedFloor,
                startNodeId,
                setStartLocation,
                targetNodeId,
                activeRoute,
                accessibleOnly,
                isQRModalOpen,
                setSelectedBuilding,
                setSelectedFloor,
                setTargetDestination,
                calculateRoute,
                clearRoute,
                toggleAccessibleRoute,
                setQRModalOpen
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const ctx = useContext(NavigationContext);
    if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
    return ctx;
};
