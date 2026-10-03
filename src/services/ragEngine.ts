import { GroundedSource, ChatMessage, LanguageCode } from '../types';
import { BUILDINGS, FACULTY_LIST, BUS_ROUTES, HOSTELS, CAMPUS_EVENTS, ADMISSION_COURSES, MAP_NODES } from '../data/mockData';

export interface KnowledgeDocument {
    id: string;
    title: string;
    category: string;
    content: string;
    keywords: string[];
    moduleTarget?: string;
    navigationNodeId?: string;
    navigationBuildingId?: string;
}

export const KNOWLEDGE_CORPUS: KnowledgeDocument[] = [
    ...HOSTELS.map(hostel => ({ id: `kb-menu-${hostel.id}`, title: `${hostel.name} mess menu`, category: 'Hostel & Dining', content: `${hostel.name}. Sample meal plan: ${hostel.messSchedule.map(day => `${day.day}: Breakfast — ${day.breakfast}; Lunch — ${day.lunch}; Snacks — ${day.snacks}; Dinner — ${day.dinner}`).join('. ')}. Confirm today's menu with the hostel office.`, keywords: ['mess menu', 'dinner', 'breakfast', 'lunch', 'hostel food'], navigationBuildingId: hostel.buildingId })),
    ...BUS_ROUTES.map(bus => ({ id: `kb-${bus.id}`, title: bus.routeName, category: 'Transport', content: `Sample bus route ${bus.routeNumber}: ${bus.stops.map(stop => `${stop.name} at ${stop.time}`).join(' → ')}. Confirm current routes with the transport office.`, keywords: ['bus route', 'transport', ...bus.stops.map(stop => stop.name.toLowerCase().split(' ')[0])], navigationBuildingId: 'b-bus', navigationNodeId: 'n-bus-node' })),
    { id: 'kb-admissions', title: 'Admissions and courses', category: 'Admissions', content: `Available sample programmes: ${ADMISSION_COURSES.map(course => `${course.degree} ${course.branch}`).join('; ')}. Visit the admissions desk at Rajendra Naidu Block for current eligibility, application procedures and fees.`, keywords: ['admission', 'admissions', 'courses', 'eligibility', 'application', 'fees'], navigationBuildingId: 'b-rj', navigationNodeId: 'n-rj-entrance' },
    // CSE Department & Faculty
    {
        id: 'kb-cse-dept',
        title: 'Department of Computer Science & Engineering (CSE)',
        category: 'Academic Departments',
        content: 'The CSE Department is located on the 2nd Floor of the New Academic Block (NEW BLOCK). Led by Dr. Sethukarasi T (HOD CSE, Cabin NEW-201). Features state-of-the-art AI, Data Science, Cloud Computing, and IoT research labs.',
        keywords: ['cse', 'computer science', 'sethukarasi', 'new block', 'hod cse', 'computer science engineering', 'where is cse', 'cse department'],
        navigationNodeId: 'n-new-block-node',
        navigationBuildingId: 'b-new'
    },
    // Central Library
    {
        id: 'kb-library',
        title: 'Central Knowledge Library',
        category: 'Campus Facilities',
        content: 'The Central Library is housed in the Swaminatha Naidu Block (SN BLOCK). It contains over 100,000 physical volumes, 10,000+ IEEE digital e-journals, quiet reading halls, and digital discussion pods. Open 7:30 AM - 8:30 PM.',
        keywords: ['library', 'central library', 'books', 'sn block', 'swaminatha naidu', 'ieee', 'reading room', 'take me to central library'],
        navigationNodeId: 'n-sn-node',
        navigationBuildingId: 'b-sn'
    },
    // Auditorium
    {
        id: 'kb-auditorium',
        title: 'RMK Grand Auditorium',
        category: 'Convention & Events',
        content: 'The RMK Grand Auditorium is an air-conditioned 1,500-seater convention hall located opposite the main entrance plaza near the Vinayagar Temple. Venue for national symposia, graduation day, and cultural festivals.',
        keywords: ['auditorium', 'grand auditorium', 'events', 'symposium', 'hall', 'where is auditorium', 'convention'],
        navigationNodeId: 'n-aud-node',
        navigationBuildingId: 'b-aud'
    },
    // Restroom
    {
        id: 'kb-restrooms',
        title: 'Campus Restroom & Hygiene Facilities',
        category: 'Services & Restrooms',
        content: 'Wheelchair-accessible restrooms are located on every floor of the Rajendra Naidu Block (RJ BLOCK), New Academic Block, and Swaminatha Naidu Block near the central elevators.',
        keywords: ['restroom', 'toilet', 'washroom', 'hygiene', 'nearest restroom', 'find restroom'],
        navigationNodeId: 'n-rj-entrance',
        navigationBuildingId: 'b-rj'
    },
    // AICTE IDEA Lab
    {
        id: 'kb-idea-lab',
        title: 'RMK AICTE IDEA Lab',
        category: 'Innovation & Research',
        content: 'The AICTE IDEA Lab is situated on the Ground Floor of Rajendra Naidu Block (RJ BLOCK). Equipped with 3D printers, laser cutters, CNC routers, IoT prototyping stations, and robotics testing arena for student inventions.',
        keywords: ['idea lab', 'aicte idea lab', 'prototype', '3d printing', 'robotics lab', 'rj block', 'where is idea lab'],
        navigationNodeId: 'n-rj-idea-lab',
        navigationBuildingId: 'b-rj'
    },
    // Hostels
    {
        id: 'kb-hostels',
        title: 'RMK Gents & Ladies Residential Hostels',
        category: 'Student Residences',
        content: 'RMK Gents Hostel (Brahmaputra, Kaveri, Narmada blocks) is located on the North-East campus boundary. RMK Ladies Hostel (Ganga, Yamuna blocks) is located on the South-East boundary with 24/7 security and dedicated mess halls.',
        keywords: ['hostel', 'gents hostel', 'ladies hostel', 'boys hostel', 'girls hostel', 'residence', 'how to reach hostel'],
        navigationNodeId: 'n-h-gents-node',
        navigationBuildingId: 'b-h-gents'
    },
    // Central Computer Centre
    {
        id: 'kb-computer-centre',
        title: 'Central Computer Centre',
        category: 'IT Facilities',
        content: 'The Central Computer Centre is located on the 1st Floor of Swaminatha Naidu Block (SN BLOCK). Features 1,200+ high-performance desktop systems with gigabit fiber internet connectivity and server farm.',
        keywords: ['computer centre', 'computer center', 'computer lab', 'sn block', 'systems', 'where is computer centre'],
        navigationNodeId: 'n-sn-node',
        navigationBuildingId: 'b-sn'
    },
    // Parking
    {
        id: 'kb-parking',
        title: 'Visitor & Faculty Parking Lot',
        category: 'Transport & Parking',
        content: 'Covered multi-tier parking for 2-wheelers, faculty cars, and visitor vehicles is located adjacent to the Main Gate Security Plaza.',
        keywords: ['parking', 'visitor parking', 'car parking', 'bike parking', 'main gate parking', 'nearest parking'],
        navigationNodeId: 'n-parking-node',
        navigationBuildingId: 'b-parking'
    },
    // Principal Office
    {
        id: 'kb-principal',
        title: 'Principal Office & Administrative Tower',
        category: 'Administration',
        content: 'The Principal Office of Dr. K. A. Mohamed Junaid is located in Room RJ-101 on the 1st Floor of Rajendra Naidu Block (R.J. Block). Placement Cell and Examination Cell are also on the same floor.',
        keywords: ['principal', 'principal office', 'dr junaid', 'rj block', 'admin office', 'placement office'],
        navigationNodeId: 'n-rj-entrance',
        navigationBuildingId: 'b-rj'
    }
];

export class RAGEngine {
    public static query(userQuery: string, lang: LanguageCode = 'en'): ChatMessage {
        const qLower = userQuery.toLowerCase().trim();
        const stopWords = new Set(['where', 'the', 'for', 'how', 'what', 'can', 'you', 'find', 'does', 'about', 'please', 'there', 'with']);
        const queryTokens = qLower.replace(/[?.,!]/g, '').split(/\s+/).filter(t => t.length > 2 && !stopWords.has(t));

        const scoredDocs = KNOWLEDGE_CORPUS.map(doc => {
            let score = 0;
            doc.keywords.forEach(kw => {
                if (qLower.includes(kw)) score += 4;
            });
            queryTokens.forEach(token => {
                if (doc.title.toLowerCase().includes(token)) score += 2;
                if (doc.content.toLowerCase().includes(token)) score += 1;
            });
            return { doc, score };
        }).sort((a, b) => b.score - a.score);

        const topMatches = scoredDocs.filter(m => m.score > 0).slice(0, 2);

        if (topMatches.length === 0) {
            return {
                id: `msg-${Date.now()}`,
                sender: 'assistant',
                text: this.getFallbackText(userQuery, lang),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }

        const topDoc = topMatches[0].doc;
        const sources: GroundedSource[] = topMatches.slice(0, 1).map(m => ({
            title: m.doc.title,
            category: m.doc.category,
            snippet: m.doc.content.slice(0, 140) + '...'
        }));

        let text = topDoc.content;

        if (lang === 'ta') {
            text = `[RMK AI பதில்] ${topDoc.content} \n\nவழிகாட்டுதலுக்கு வளாக வரைபடத்தைப் பயன்படுத்தவும்.`;
        } else if (lang === 'hi') {
            text = `[RMK AI उत्तर] ${topDoc.content} \n\nदिशा निर्देशों के लिए परिसर मानचित्र देखें।`;
        } else if (lang === 'te') {
            text = `[RMK AI సమాధానం] ${topDoc.content} \n\nమార్గదర్శకత్వం కోసం క్యాంపస్ మ్యాప్‌ని చూడండి.`;
        }

        let navigationAction;
        if (topDoc.navigationNodeId && topDoc.navigationBuildingId) {
            const bldg = BUILDINGS.find(b => b.id === topDoc.navigationBuildingId);
            const bldgName = bldg ? bldg.name : 'Target Building';
            navigationAction = {
                toNodeId: topDoc.navigationNodeId,
                toBuildingId: topDoc.navigationBuildingId,
                label: `Directions to ${bldg?.shortName || bldgName}`
            };
        }

        return {
            id: `msg-${Date.now()}`,
            sender: 'assistant',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources,
            navigationAction
        };
    }

    private static getFallbackText(query: string, lang: LanguageCode): string {
        return `I couldn't find reliable information for "${query}" in this campus guide. Try the CSE Department, Central Library, Auditorium, admissions, hostel menus or bus routes. For information outside this guide, contact the college office.`;
    }
}
