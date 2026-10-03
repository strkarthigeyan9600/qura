import { MapNode, NavigationRoute } from '../types';
import { MAP_NODES, BUILDINGS } from '../data/mockData';

export class NavigationGraphService {
    /**
     * Find optimal walking route using Dijkstra / A* algorithm
     */
    public static findRoute(
        fromNodeId: string,
        toNodeId: string,
        accessibleOnly: boolean = false
    ): NavigationRoute | null {
        const nodeMap = new Map<string, MapNode>();
        MAP_NODES.forEach(node => nodeMap.set(node.id, node));

        const startNode = nodeMap.get(fromNodeId);
        const endNode = nodeMap.get(toNodeId);

        if (!startNode || !endNode) return null;

        const distances = new Map<string, number>();
        const previous = new Map<string, string | null>();
        const unvisited = new Set<string>();

        MAP_NODES.forEach(node => {
            distances.set(node.id, Infinity);
            previous.set(node.id, null);
            unvisited.add(node.id);
        });

        distances.set(fromNodeId, 0);

        while (unvisited.size > 0) {
            // Find node in unvisited with smallest distance
            let currentId: string | null = null;
            let smallestDist = Infinity;

            unvisited.forEach(id => {
                const d = distances.get(id) ?? Infinity;
                if (d < smallestDist) {
                    smallestDist = d;
                    currentId = id;
                }
            });

            if (!currentId || smallestDist === Infinity) break;
            if (currentId === toNodeId) break;

            unvisited.delete(currentId);
            const currentNode = nodeMap.get(currentId)!;

            // Explore neighbors
            currentNode.connections.forEach(neighborId => {
                if (!unvisited.has(neighborId)) return;
                const neighborNode = nodeMap.get(neighborId);
                if (!neighborNode) return;

                // Skip non-accessible nodes if accessibleOnly flag is set
                if (accessibleOnly && !neighborNode.isAccessible) return;

                // Distance cost (Euclidean 2D + floor penalty if switching floors)
                const dx = currentNode.x - neighborNode.x;
                const dy = currentNode.y - neighborNode.y;
                let edgeWeight = Math.sqrt(dx * dx + dy * dy) * 10; // scale to meters approx

                if (currentNode.floorNumber !== neighborNode.floorNumber) {
                    edgeWeight += neighborNode.category === 'elevator' ? 5 : 20;
                }

                const alt = (distances.get(currentId!) || 0) + edgeWeight;
                if (alt < (distances.get(neighborId) ?? Infinity)) {
                    distances.set(neighborId, alt);
                    previous.set(neighborId, currentId);
                }
            });
        }

        // Reconstruct path
        const path: MapNode[] = [];
        let curr: string | null = toNodeId;
        while (curr) {
            const node = nodeMap.get(curr);
            if (node) path.unshift(node);
            curr = previous.get(curr) || null;
        }

        if (path.length === 0 || path[0].id !== fromNodeId) return null;

        // Calculate total meters & time
        let totalMeters = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i].x - path[i + 1].x;
            const dy = path[i].y - path[i + 1].y;
            totalMeters += Math.round(Math.sqrt(dx * dx + dy * dy) * 5);
        }
        const estimatedWalkingMinutes = Math.ceil(totalMeters / 70); // ~70m per min

        // Generate step instructions
        const steps = path.map((node, idx) => {
            let instruction = `Proceed to ${node.name}`;
            if (idx === 0) instruction = `Start at ${node.name}`;
            else if (idx === path.length - 1) instruction = `Arrive at destination: ${node.name}`;
            else if (node.category === 'elevator') instruction = `Take Elevator at ${node.name} to Floor ${node.floorNumber}`;
            else if (node.category === 'stairs') instruction = `Use Stairs to Floor ${node.floorNumber}`;

            return {
                instruction,
                distanceMeters: idx === 0 ? 0 : Math.round(Math.hypot(node.x - path[idx - 1].x, node.y - path[idx - 1].y) * 5),
                nodeId: node.id,
                floorNumber: node.floorNumber
            };
        });

        const fromBldg = BUILDINGS.find(b => b.id === startNode.buildingId) || BUILDINGS[0];
        const toBldg = BUILDINGS.find(b => b.id === endNode.buildingId) || BUILDINGS[0];

        return {
            fromNodeId,
            toNodeId,
            fromBuilding: fromBldg,
            toBuilding: toBldg,
            path,
            totalDistanceMeters: totalMeters,
            estimatedWalkingMinutes,
            isAccessible: accessibleOnly || path.every(n => n.isAccessible),
            steps
        };
    }
}
