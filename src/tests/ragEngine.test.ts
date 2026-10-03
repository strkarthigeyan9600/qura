import { describe, it, expect } from 'vitest';
import { RAGEngine } from '../services/ragEngine';
import { NavigationGraphService } from '../services/navigationGraph';
import { MAP_NODES } from '../data/mockData';
describe('Campus knowledge search', () => {
it('finds the current CSE location with sources and navigation', () => { const result = RAGEngine.query('Where is the CSE department?', 'en'); expect(result.sender).toBe('assistant'); expect(result.sources?.length).toBeGreaterThan(0); expect(result.navigationAction?.toBuildingId).toBe('b-new'); });
it('answers hostel dining queries from the hostel corpus', () => { const result = RAGEngine.query('hostel mess menu for dinner', 'en'); expect(result.text.toLowerCase()).toContain('hostel'); expect(result.sources?.some(s => s.category.includes('Hostel'))).toBe(true); });
});
describe('Campus routing', () => {
it('routes between user-selected buildings', () => { const route = NavigationGraphService.findRoute('n-rj-entrance','n-sn-node'); expect(route?.fromNodeId).toBe('n-rj-entrance'); expect(route?.toNodeId).toBe('n-sn-node'); });
it('routes with the selected endpoints reversed', () => { const route = NavigationGraphService.findRoute('n-sn-node','n-rj-entrance'); expect(route?.fromNodeId).toBe('n-sn-node'); expect(route?.toNodeId).toBe('n-rj-entrance'); });
it.each(MAP_NODES.map(n => [n.id]))('can reach %s from the actual main gate', id => { const route = NavigationGraphService.findRoute('n-gate-kiosk',id); expect(route).not.toBeNull(); expect(route?.path[0].id).toBe('n-gate-kiosk'); expect(route?.path[route.path.length - 1]?.id).toBe(id); });
it('keeps accessible routes on accessible nodes', () => { const route = NavigationGraphService.findRoute('n-gate-kiosk','n-sn-node',true); expect(route).not.toBeNull(); expect(route?.path.every(n => n.isAccessible)).toBe(true); });
it('rejects unknown destinations', () => { expect(NavigationGraphService.findRoute('n-gate-kiosk','missing')).toBeNull(); });
});
