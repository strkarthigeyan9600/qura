export type UserRole = 'visitor' | 'student' | 'parent' | 'alumni' | 'faculty' | 'staff' | 'admin';

export type LanguageCode = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'mr' | 'ta' | 'te';

export interface Building {
    id: string;
    name: string;
    code: string;
    category: 'academic' | 'labs' | 'facility' | 'hostel' | 'administrative' | 'services' | 'important' | 'sports' | 'emergency';
    shortName?: string;
    floorCount: number;
    coordinates: { x: number; y: number };
    icon: string;
    description: string;
    facilities: string[];
    departments: string[];
    operatingHours?: string;
    landmarkTag?: string;
}

export interface MapNode {
    id: string;
    buildingId: string;
    floorNumber: number; // 0 for Ground, 1 for 1st floor, etc.
    name: string;
    code: string;
    category: 'room' | 'lab' | 'office' | 'elevator' | 'stairs' | 'restroom' | 'exit' | 'canteen';
    x: number; // percentage or pixel offset on map
    y: number;
    connections: string[]; // Node IDs connected to this node for pathfinding
    isAccessible: boolean;
}

export interface NavigationRoute {
    fromNodeId: string;
    toNodeId: string;
    fromBuilding: Building;
    toBuilding: Building;
    path: MapNode[];
    totalDistanceMeters: number;
    estimatedWalkingMinutes: number;
    isAccessible: boolean;
    steps: {
        instruction: string;
        distanceMeters: number;
        nodeId: string;
        floorNumber: number;
    }[];
}

export interface Faculty {
    id: string;
    name: string;
    title: string;
    department: string;
    email: string;
    phone: string;
    cabinNumber: string;
    buildingId: string;
    buildingName: string;
    floorNumber: number;
    officeHours: string;
    designation: string;
    researchArea: string;
    photoUrl: string;
}

export interface BusRoute {
    id: string;
    routeNumber: string;
    routeName: string;
    busNumber: string;
    driverContact: string;
    status: 'On Time' | 'Delayed' | 'Approaching Kiosk' | 'In Transit';
    nextArrivalMinutes: number;
    stops: {
        name: string;
        time: string;
        isPassed: boolean;
    }[];
}

export interface MessMenuDay {
    day: string;
    breakfast: string;
    lunch: string;
    snacks: string;
    dinner: string;
}

export interface Hostel {
    id: string;
    name: string;
    code: string;
    type: 'Boys' | 'Girls' | 'Research Scholar';
    capacity: number;
    wardenName: string;
    wardenContact: string;
    buildingId: string;
    messSchedule: MessMenuDay[];
    rules: string[];
    facilities: string[];
}

export interface CampusEvent {
    id: string;
    title: string;
    category: 'Seminar' | 'Hackathon' | 'Placement Drive' | 'Workshop' | 'Cultural' | 'Sports' | 'Guest Lecture';
    date: string;
    time: string;
    location: string;
    buildingId: string;
    description: string;
    speaker?: string;
    organizer: string;
    registrationStatus: 'Open' | 'Closed' | 'On Spot';
}

export interface AdmissionCourse {
    id: string;
    degree: string; // B.Tech, M.Tech, Ph.D, MBA
    branch: string;
    durationYears: number;
    eligibility: string;
    annualFee: number;
    intakeCapacity: number;
}

export interface GroundedSource {
    title: string;
    category: string;
    snippet: string;
    urlOrModule?: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant' | 'system';
    text: string;
    timestamp: string;
    sources?: GroundedSource[];
    navigationAction?: {
        fromNodeId?: string;
        toNodeId: string;
        toBuildingId: string;
        label: string;
    };
}

export interface AnalyticsStats {
    totalVisitorsToday: number;
    avgSessionDurationSeconds: number;
    activeVoiceQueries: number;
    topSearchedBuildings: { name: string; count: number }[];
    frequentFaqs: { question: string; count: number }[];
    languageUsage: { lang: string; percentage: number }[];
    hourlyTraffic: { hour: string; count: number }[];
}
