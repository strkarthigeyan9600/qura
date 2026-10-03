import express from 'express';
import cors from 'cors';
import { RAGEngine } from '../src/services/ragEngine';
import { NavigationGraphService } from '../src/services/navigationGraph';
import { BUILDINGS, MAP_NODES, FACULTY_MEMBERS, BUS_ROUTES, HOSTELS, CAMPUS_EVENTS, ADMISSION_COURSES, ANALYTICS_DATA } from '../src/data/mockData';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'healthy',
        system: 'AI Campus Concierge REST API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// 2. AI RAG Query Endpoint
app.post('/api/v1/ai/chat', (req, res) => {
    const { query, language = 'en' } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const response = RAGEngine.query(query, language);
    res.json(response);
});

// 3. Navigation Endpoints
app.get('/api/v1/navigation/buildings', (req, res) => {
    res.json({ count: BUILDINGS.length, buildings: BUILDINGS });
});

app.get('/api/v1/navigation/nodes', (req, res) => {
    const { buildingId, floorNumber } = req.query;
    let nodes = MAP_NODES;
    if (buildingId) {
        nodes = nodes.filter(n => n.buildingId === buildingId);
    }
    if (floorNumber !== undefined) {
        nodes = nodes.filter(n => n.floorNumber === Number(floorNumber));
    }
    res.json({ count: nodes.length, nodes });
});

app.post('/api/v1/navigation/route', (req, res) => {
    const { fromNodeId, toNodeId, accessibleOnly = false } = req.body;
    if (!fromNodeId || !toNodeId) {
        return res.status(400).json({ error: 'fromNodeId and toNodeId are required' });
    }

    const route = NavigationGraphService.findRoute(fromNodeId, toNodeId, accessibleOnly);
    if (!route) {
        return res.status(404).json({ error: 'Route could not be calculated' });
    }
    res.json(route);
});

// 4. Faculty Finder Endpoint
app.get('/api/v1/faculty', (req, res) => {
    const { search, department } = req.query;
    let list = FACULTY_MEMBERS;
    if (department) {
        list = list.filter((f: any) => f.department.toLowerCase().includes(String(department).toLowerCase()));
    }
    if (search) {
        const q = String(search).toLowerCase();
        list = list.filter((f: any) => f.name.toLowerCase().includes(q) || f.researchArea.toLowerCase().includes(q) || f.cabinNumber.toLowerCase().includes(q));
    }
    res.json({ count: list.length, faculty: list });
});

// 5. Transport & Bus Management Endpoint
app.get('/api/v1/bus/routes', (req, res) => {
    res.json({ count: BUS_ROUTES.length, routes: BUS_ROUTES });
});

// 6. Hostels & Dining Endpoint
app.get('/api/v1/hostels', (req, res) => {
    res.json({ count: HOSTELS.length, hostels: HOSTELS });
});

// 7. Events Endpoint
app.get('/api/v1/events', (req, res) => {
    res.json({ count: CAMPUS_EVENTS.length, events: CAMPUS_EVENTS });
});

// 8. Admissions Endpoint
app.get('/api/v1/admissions', (req, res) => {
    res.json({ courses: ADMISSION_COURSES });
});

// 9. Analytics Endpoint
app.get('/api/v1/analytics', (req, res) => {
    res.json(ANALYTICS_DATA);
});

// 10. Admin Auth & Actions
app.post('/api/v1/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({
            success: true,
            token: 'jwt-admin-concierge-token-89123',
            user: { name: 'Super Administrator', role: 'admin', email: 'admin@campus.edu' }
        });
    } else {
        res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 AI Campus Concierge REST API Server running on port ${PORT}`);
});
