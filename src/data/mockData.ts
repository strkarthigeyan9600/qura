import { Building, MapNode, Faculty, BusRoute, Hostel, CampusEvent, AdmissionCourse, AnalyticsStats } from '../types';

export const BUILDINGS: Building[] = [
    {
        id: 'b-gate',
        name: 'Main Gate & Welcome Plaza',
        code: 'GATE',
        shortName: 'Main Gate',
        category: 'services',
        floorCount: 1,
        coordinates: { x: 10, y: 55 },
        icon: 'MapPin',
        description: 'Primary security gate, visitor registration counter, and smart kiosk entry point for RMK Engineering College.',
        facilities: ['Security Counter', 'Visitor Pass Desk', 'Kiosk Terminal 01', 'Waiting Lounge', 'Bus Drop Zone'],
        departments: ['Campus Security', 'Visitor Concierge'],
        operatingHours: '24/7 Open',
        landmarkTag: 'Main Campus Entrance'
    },
    {
        id: 'b-temple',
        name: 'Vinayagar Temple',
        code: 'TEMPLE',
        shortName: 'Temple',
        category: 'important',
        floorCount: 1,
        coordinates: { x: 15, y: 40 },
        icon: 'Sparkles',
        description: 'Serene Vinayagar Temple located near the main entrance, welcoming students, faculty, and guests.',
        facilities: ['Prayer Hall', 'Courtyard Garden', 'Footwear Stand'],
        departments: ['Campus Spiritual Centre'],
        operatingHours: '6:00 AM - 8:00 PM',
        landmarkTag: 'Entrance Landmark'
    },
    {
        id: 'b-rj',
        name: 'Rajendra Naidu Block (R.J. Block)',
        code: 'RJ BLOCK',
        shortName: 'RJ Block',
        category: 'administrative',
        floorCount: 4,
        coordinates: { x: 28, y: 35 },
        icon: 'Building2',
        description: 'Main Administrative headquarters housing Principal Office, Director, Training & Placement Cell, AICTE IDEA Lab, and Seminar Halls.',
        facilities: ['Principal Office', 'Training & Placement Cell', 'AICTE IDEA Lab', 'Executive Conference Room', 'Main Seminar Hall 1 & 2', 'ATM Counter'],
        departments: ['Administration', 'Training & Placement', 'AICTE IDEA Lab', 'Accounts & Finance', 'Exam Cell'],
        operatingHours: '8:00 AM - 6:00 PM',
        landmarkTag: 'Admin & Placement Hub'
    },
    {
        id: 'b-new',
        name: 'New Academic Block',
        code: 'NEW BLOCK',
        shortName: 'New Block',
        category: 'academic',
        floorCount: 5,
        coordinates: { x: 48, y: 25 },
        icon: 'GraduationCap',
        description: 'Modern academic wing housing Computer Science & Engineering (CSE), Artificial Intelligence & Data Science (ADS), Computer Science & Design (CSD), CSBS, and Electrical & Electronics (EEE).',
        facilities: ['Smart Classrooms', 'AI & Machine Learning Lab', 'Cloud Computing Lab', 'IoT Innovation Lab', 'High-Speed Wi-Fi', 'Faculty Cabins', 'Restrooms'],
        departments: ['Computer Science & Engg (CSE)', 'AI & Data Science (ADS)', 'CS & Design (CSD)', 'CS & Business Systems (CSBS)', 'Electrical & Electronics (EEE)'],
        operatingHours: '7:30 AM - 7:00 PM',
        landmarkTag: 'CSE & AI Academic Hub'
    },
    {
        id: 'b-sn',
        name: 'Swaminatha Naidu Block',
        code: 'SN BLOCK',
        shortName: 'SN Block',
        category: 'facility',
        floorCount: 4,
        coordinates: { x: 42, y: 50 },
        icon: 'BookOpen',
        description: 'Houses the Central Knowledge Library with over 100,000 volumes, IEEE digital access, and Central Computer Centre with 1200+ systems.',
        facilities: ['Central Library', 'Central Computer Centre', 'IEEE E-Journal Lounge', 'Digital Reference Library', 'Quiet Study Rooms', 'Server Room'],
        departments: ['Library & Information Services', 'Central Computer Centre', 'IT Infrastructure'],
        operatingHours: '7:30 AM - 8:30 PM',
        landmarkTag: 'Library & Super Computer Hub'
    },
    {
        id: 'b-sv',
        name: 'Srinivasa Block (S.V. Block)',
        code: 'SV BLOCK',
        shortName: 'SV Block',
        category: 'academic',
        floorCount: 4,
        coordinates: { x: 62, y: 35 },
        icon: 'Cpu',
        description: 'Dedicated academic block for Information Technology (IT) and Electronics & Communication Engineering (ECE), alongside Centre of Excellence labs.',
        facilities: ['CoE Cyber Security Lab', 'CoE Robotics & Automation', 'VLSI Design Lab', 'Embedded Systems Lab', 'Telecom & Networking Studio'],
        departments: ['Information Technology (IT)', 'Electronics & Communication (ECE)', 'Centre of Excellence (CoE)'],
        operatingHours: '8:00 AM - 6:30 PM',
        landmarkTag: 'ECE & IT Block'
    },
    {
        id: 'b-lk',
        name: 'Lakshmikanthammal Block (L.K. Block)',
        code: 'LK BLOCK',
        shortName: 'LK Block',
        category: 'academic',
        floorCount: 3,
        coordinates: { x: 32, y: 68 },
        icon: 'FlaskConical',
        description: 'Foundation block for Science & Humanities (1st Year B.E./B.Tech) and Mechanical Engineering departments.',
        facilities: ['Engineering Chemistry Lab', 'Physics Lab', 'Communication Skills Lab', 'Mechanical Workshop', 'Drawing Halls'],
        departments: ['Science & Humanities (S&H)', 'Mechanical Engineering'],
        operatingHours: '8:00 AM - 5:30 PM',
        landmarkTag: 'First Year & Science Block'
    },
    {
        id: 'b-ss',
        name: 'Sathya Sai Block (SS Block)',
        code: 'SS BLOCK',
        shortName: 'SS Block',
        category: 'labs',
        floorCount: 3,
        coordinates: { x: 52, y: 70 },
        icon: 'Microscope',
        description: 'Advanced basic sciences research block featuring environmental testing, advanced chemistry, and instrumentation laboratories.',
        facilities: ['Advanced Chemical Analysis Lab', 'Material Testing Facility', 'Research Instrumentation Room'],
        departments: ['Applied Sciences', 'Research & Development'],
        operatingHours: '8:00 AM - 6:00 PM',
        landmarkTag: 'Science Research Labs'
    },
    {
        id: 'b-pv',
        name: 'Padmavathy Block (PV Block)',
        code: 'PV BLOCK',
        shortName: 'PV Block',
        category: 'labs',
        floorCount: 3,
        coordinates: { x: 68, y: 65 },
        icon: 'Zap',
        description: 'Specialized lab facility for Electrical Machines, High Voltage Engineering, Power Electronics, and Automation Systems.',
        facilities: ['High Voltage Engineering Lab', 'Power Systems Simulation Lab', 'Electric Drives & Automation Lab'],
        departments: ['Electrical Engineering Labs', 'Automation Research'],
        operatingHours: '8:00 AM - 6:00 PM',
        landmarkTag: 'EEE Labs'
    },
    {
        id: 'b-vr',
        name: 'Vijayragavalu Naidu Block (VR Block)',
        code: 'VR BLOCK',
        shortName: 'VR Block',
        category: 'academic',
        floorCount: 3,
        coordinates: { x: 75, y: 50 },
        icon: 'Compass',
        description: 'Home to Civil Engineering department, Structural Dynamics Lab, Hydraulics & Environmental Engineering Facility.',
        facilities: ['Surveying Lab', 'Soil Mechanics Lab', 'Structural Testing Rig', 'CAD/CAM Civil Studio'],
        departments: ['Civil Engineering'],
        operatingHours: '8:00 AM - 5:30 PM',
        landmarkTag: 'Civil Engineering Block'
    },
    {
        id: 'b-aud',
        name: 'RMK Grand Auditorium',
        code: 'AUDITORIUM',
        shortName: 'Auditorium',
        category: 'facility',
        floorCount: 2,
        coordinates: { x: 35, y: 20 },
        icon: 'Trophy',
        description: 'State-of-the-art air-conditioned auditorium with 1,500+ seating capacity, acoustics, and stage infrastructure for national symposia.',
        facilities: ['1,500 Seating Hall', 'Stage Lighting & Audio System', 'Green Rooms', 'VVIP Lounge'],
        departments: ['Campus Cultural & Events Cell'],
        operatingHours: 'Events Schedule',
        landmarkTag: 'Grand Convention Hall'
    },
    {
        id: 'b-h-gents',
        name: 'RMK Gents Hostel Block',
        code: 'BOYS HOSTEL',
        shortName: 'Gents Hostel',
        category: 'hostel',
        floorCount: 5,
        coordinates: { x: 88, y: 25 },
        icon: 'Home',
        description: 'Modern residential block for male engineering students (Brahmaputra, Kaveri, Narmada, Krishna quarters) with 24/7 security.',
        facilities: ['Wi-Fi Connectivity', 'Study Lounge', 'GYM Unit', 'Solar Hot Water', 'Indoor Games Arena'],
        departments: ['Hostel Administration'],
        operatingHours: '24/7 Resident Access',
        landmarkTag: 'Boys Residence'
    },
    {
        id: 'b-h-ladies',
        name: 'RMK Ladies Hostel Block',
        code: 'GIRLS HOSTEL',
        shortName: 'Ladies Hostel',
        category: 'hostel',
        floorCount: 5,
        coordinates: { x: 88, y: 70 },
        icon: 'Home',
        description: 'Secure and comfortable residential accommodation for female engineering students (Ganga, Yamuna, Saraswathi blocks).',
        facilities: ['Biometric Access Control', 'Reading Lounge', 'Fitness Center', 'Solar Water Heating', '24/7 Security Desk'],
        departments: ['Hostel Administration'],
        operatingHours: '24/7 Resident Access',
        landmarkTag: 'Girls Residence'
    },
    {
        id: 'b-mess-boys',
        name: 'Boys Central Mess',
        code: 'BOYS MESS',
        shortName: 'Boys Mess',
        category: 'services',
        floorCount: 2,
        coordinates: { x: 82, y: 35 },
        icon: 'Utensils',
        description: 'Spacious dining facility providing nutritious, hygienic veg dining for boys hostel residents.',
        facilities: ['1,200 Seating Dining Hall', 'Steam Kitchen', 'Mineral Water Plant'],
        departments: ['Catering Services'],
        operatingHours: 'Breakfast, Lunch, Snacks, Dinner',
        landmarkTag: 'Boys Dining Complex'
    },
    {
        id: 'b-mess-girls',
        name: 'Girls Central Mess',
        code: 'GIRLS MESS',
        shortName: 'Girls Mess',
        category: 'services',
        floorCount: 2,
        coordinates: { x: 82, y: 60 },
        icon: 'Utensils',
        description: 'Hygienic dining hall serving delicious healthy meals for girls hostel residents.',
        facilities: ['1,000 Seating Dining Hall', 'Purified Drinking Water', 'Eco-friendly Waste Unit'],
        departments: ['Catering Services'],
        operatingHours: 'Breakfast, Lunch, Snacks, Dinner',
        landmarkTag: 'Girls Dining Complex'
    },
    {
        id: 'b-sports',
        name: 'RMK Sports Complex & Pavilion',
        code: 'SPORTS',
        shortName: 'Sports Ground',
        category: 'sports',
        floorCount: 1,
        coordinates: { x: 75, y: 82 },
        icon: 'Trophy',
        description: 'Expansive sports pavilion containing standard cricket oval, football ground, basketball court, tennis courts, and indoor gym.',
        facilities: ['Cricket Oval', 'Football Field', 'Basketball Court', 'Gymnasium', 'Athletics Track'],
        departments: ['Physical Education'],
        operatingHours: '6:00 AM - 7:00 PM',
        landmarkTag: 'Sports & Cricket Oval'
    },
    {
        id: 'b-bus',
        name: 'Campus Bus Yard & Transport Station',
        code: 'BUS BAY',
        shortName: 'Bus Bay',
        category: 'services',
        floorCount: 1,
        coordinates: { x: 18, y: 80 },
        icon: 'Bus',
        description: 'Primary bus bay where over 100 green college buses pick up and drop off students across Chennai, Thiruvallur, & Kanchipuram.',
        facilities: ['100+ Bus Parking Bay', 'Driver Resting Room', 'Transport Desk', 'Shuttle Boarding Point'],
        departments: ['Transport Division'],
        operatingHours: '6:30 AM - 6:30 PM',
        landmarkTag: 'Bus Fleet Depot'
    },
    {
        id: 'b-parking',
        name: 'Visitor & Faculty Parking Lot',
        code: 'PARKING',
        shortName: 'Parking',
        category: 'services',
        floorCount: 1,
        coordinates: { x: 12, y: 70 },
        icon: 'Car',
        description: 'Designated sheltered multi-tier parking zone for visitors, parents, and faculty vehicles near the Main Gate.',
        facilities: ['Covered 2-Wheeler Bay', 'Car Parking Rows', 'EV Charging Station'],
        departments: ['Campus Security'],
        operatingHours: '24/7 Security Managed',
        landmarkTag: 'Main Parking Zone'
    },
    {
        id: 'b-health',
        name: 'Campus Health & Medical Centre',
        code: 'HEALTH',
        shortName: 'Health Centre',
        category: 'emergency',
        floorCount: 1,
        coordinates: { x: 22, y: 62 },
        icon: 'HeartPulse',
        description: '24/7 medical center staffed with resident medical officers, emergency beds, pharmacy, and dedicated 24/7 ambulance.',
        facilities: ['Emergency Ward', 'Resident Doctor Cabin', 'Pharmacy Counter', '24/7 Ambulance Unit'],
        departments: ['Medical Services'],
        operatingHours: '24/7 Emergency Medical',
        landmarkTag: 'Emergency Medical Station'
    },
    {
        id: 'b-stp',
        name: 'STP Plant & Solar Eco Park',
        code: 'ECO YARD',
        shortName: 'Eco Yard',
        category: 'services',
        floorCount: 1,
        coordinates: { x: 92, y: 48 },
        icon: 'Leaf',
        description: 'Zero-discharge Sewage Treatment Plant and Solar Power Grid providing clean energy and water recycling for campus lawns.',
        facilities: ['Solar Panels', 'Water Recycling Unit', 'Compost Yard'],
        departments: ['Estate Maintenance'],
        operatingHours: 'Authorized Personnel Only',
        landmarkTag: 'Green Initiative Zone'
    }
];

export const MAP_NODES: MapNode[] = [
    // Main Gate Node (Start Kiosk)
    {
        id: 'n-gate-kiosk',
        buildingId: 'b-gate',
        floorNumber: 0,
        name: 'Main Gate Security Kiosk 01 (You Are Here)',
        code: 'GATE-01',
        category: 'exit',
        x: 10,
        y: 55,
        connections: ['n-gate-road-1', 'n-temple-node', 'n-parking-node', 'n-bus-node'],
        isAccessible: true
    },
    {
        id: 'n-gate-road-1',
        buildingId: 'b-gate',
        floorNumber: 0,
        name: 'Main Entrance Avenue Junction',
        code: 'J-ENTRANCE',
        category: 'room',
        x: 18,
        y: 52,
        connections: ['n-gate-kiosk', 'n-temple-node', 'n-rj-entrance', 'n-health-node'],
        isAccessible: true
    },
    {
        id: 'n-temple-node',
        buildingId: 'b-temple',
        floorNumber: 0,
        name: 'Vinayagar Temple Courtyard',
        code: 'TMP-01',
        category: 'room',
        x: 15,
        y: 40,
        connections: ['n-gate-kiosk', 'n-gate-road-1', 'n-aud-node'],
        isAccessible: true
    },
    {
        id: 'n-aud-node',
        buildingId: 'b-aud',
        floorNumber: 0,
        name: 'Auditorium Entrance Plaza',
        code: 'AUD-01',
        category: 'room',
        x: 35,
        y: 20,
        connections: ['n-temple-node', 'n-rj-entrance', 'n-new-block-node'],
        isAccessible: true
    },
    {
        id: 'n-rj-entrance',
        buildingId: 'b-rj',
        floorNumber: 0,
        name: 'R.J. Block Main Reception & Admin Desk',
        code: 'RJ-G01',
        category: 'office',
        x: 28,
        y: 35,
        connections: ['n-gate-road-1', 'n-aud-node', 'n-rj-idea-lab', 'n-sn-node', 'n-lk-node'],
        isAccessible: true
    },
    {
        id: 'n-rj-idea-lab',
        buildingId: 'b-rj',
        floorNumber: 0,
        name: 'AICTE IDEA Lab & Placement Cell (RJ Block)',
        code: 'RJ-G02',
        category: 'lab',
        x: 30,
        y: 32,
        connections: ['n-rj-entrance'],
        isAccessible: true
    },
    {
        id: 'n-new-block-node',
        buildingId: 'b-new',
        floorNumber: 0,
        name: 'New Academic Block Lobby (CSE / ADS / EEE)',
        code: 'NEW-G01',
        category: 'room',
        x: 48,
        y: 25,
        connections: ['n-aud-node', 'n-rj-entrance', 'n-sn-node', 'n-sv-node', 'n-h-gents-node'],
        isAccessible: true
    },
    {
        id: 'n-sn-node',
        buildingId: 'b-sn',
        floorNumber: 0,
        name: 'Swaminatha Naidu Block - Central Library Entrance',
        code: 'SN-G01',
        category: 'room',
        x: 42,
        y: 50,
        connections: ['n-rj-entrance', 'n-new-block-node', 'n-sv-node', 'n-ss-node', 'n-lk-node'],
        isAccessible: true
    },
    {
        id: 'n-sv-node',
        buildingId: 'b-sv',
        floorNumber: 0,
        name: 'S.V. Block Entrance (IT / ECE / CoE)',
        code: 'SV-G01',
        category: 'room',
        x: 62,
        y: 35,
        connections: ['n-new-block-node', 'n-sn-node', 'n-pv-node', 'n-vr-node', 'n-mess-boys-node'],
        isAccessible: true
    },
    {
        id: 'n-lk-node',
        buildingId: 'b-lk',
        floorNumber: 0,
        name: 'L.K. Block - Science & Humanities Entrance',
        code: 'LK-G01',
        category: 'room',
        x: 32,
        y: 68,
        connections: ['n-gate-road-1', 'n-health-node', 'n-rj-entrance', 'n-sn-node', 'n-ss-node'],
        isAccessible: true
    },
    {
        id: 'n-ss-node',
        buildingId: 'b-ss',
        floorNumber: 0,
        name: 'Sathya Sai Block - Chemistry & Physics Labs',
        code: 'SS-G01',
        category: 'lab',
        x: 52,
        y: 70,
        connections: ['n-sn-node', 'n-lk-node', 'n-pv-node', 'n-sports-node'],
        isAccessible: true
    },
    {
        id: 'n-pv-node',
        buildingId: 'b-pv',
        floorNumber: 0,
        name: 'Padmavathy Block - EEE High Voltage Lab',
        code: 'PV-G01',
        category: 'lab',
        x: 68,
        y: 65,
        connections: ['n-sv-node', 'n-ss-node', 'n-vr-node', 'n-h-ladies-node'],
        isAccessible: true
    },
    {
        id: 'n-vr-node',
        buildingId: 'b-vr',
        floorNumber: 0,
        name: 'Vijayragavalu Naidu Block - Civil Engg Entrance',
        code: 'VR-G01',
        category: 'room',
        x: 75,
        y: 50,
        connections: ['n-sv-node', 'n-pv-node', 'n-stp-node', 'n-mess-boys-node'],
        isAccessible: true
    },
    {
        id: 'n-h-gents-node',
        buildingId: 'b-h-gents',
        floorNumber: 0,
        name: 'Gents Hostel Entrance Gate',
        code: 'BH-01',
        category: 'room',
        x: 88,
        y: 25,
        connections: ['n-new-block-node', 'n-mess-boys-node'],
        isAccessible: true
    },
    {
        id: 'n-mess-boys-node',
        buildingId: 'b-mess-boys',
        floorNumber: 0,
        name: 'Boys Central Mess Entrance',
        code: 'BM-01',
        category: 'canteen',
        x: 82,
        y: 35,
        connections: ['n-h-gents-node', 'n-sv-node', 'n-vr-node', 'n-stp-node'],
        isAccessible: true
    },
    {
        id: 'n-h-ladies-node',
        buildingId: 'b-h-ladies',
        floorNumber: 0,
        name: 'Ladies Hostel Entrance Security Desk',
        code: 'GH-01',
        category: 'room',
        x: 88,
        y: 70,
        connections: ['n-mess-girls-node', 'n-pv-node', 'n-stp-node'],
        isAccessible: true
    },
    {
        id: 'n-mess-girls-node',
        buildingId: 'b-mess-girls',
        floorNumber: 0,
        name: 'Girls Central Mess Entrance',
        code: 'GM-01',
        category: 'canteen',
        x: 82,
        y: 60,
        connections: ['n-h-ladies-node', 'n-pv-node'],
        isAccessible: true
    },
    {
        id: 'n-sports-node',
        buildingId: 'b-sports',
        floorNumber: 0,
        name: 'Sports Complex Pavilion & Gymnasium',
        code: 'SPT-01',
        category: 'room',
        x: 75,
        y: 82,
        connections: ['n-ss-node', 'n-pv-node', 'n-h-ladies-node'],
        isAccessible: true
    },
    {
        id: 'n-bus-node',
        buildingId: 'b-bus',
        floorNumber: 0,
        name: 'Bus Fleet Boarding Bay',
        code: 'BUS-01',
        category: 'exit',
        x: 18,
        y: 80,
        connections: ['n-gate-kiosk', 'n-parking-node', 'n-health-node'],
        isAccessible: true
    },
    {
        id: 'n-parking-node',
        buildingId: 'b-parking',
        floorNumber: 0,
        name: 'Visitor Parking Lot Entry',
        code: 'PRK-01',
        category: 'room',
        x: 12,
        y: 70,
        connections: ['n-gate-kiosk', 'n-bus-node'],
        isAccessible: true
    },
    {
        id: 'n-health-node',
        buildingId: 'b-health',
        floorNumber: 0,
        name: 'Campus Health Centre Clinic Door',
        code: 'MED-01',
        category: 'room',
        x: 22,
        y: 62,
        connections: ['n-gate-road-1', 'n-lk-node', 'n-bus-node'],
        isAccessible: true
    },
    {
        id: 'n-stp-node',
        buildingId: 'b-stp',
        floorNumber: 0,
        name: 'STP Plant & Solar Yard Service Access',
        code: 'STP-01',
        category: 'room',
        x: 92,
        y: 48,
        connections: ['n-vr-node', 'n-mess-boys-node', 'n-h-ladies-node'],
        isAccessible: true
    }
];

export const FACULTY_LIST: Faculty[] = [
    {
        id: 'f-1',
        name: 'Dr. K. A. Mohamed Junaid',
        title: 'Principal',
        department: 'Administration',
        email: 'principal@rmkec.ac.in',
        phone: '+91 44 6790 6790',
        cabinNumber: 'RJ-101',
        buildingId: 'b-rj',
        buildingName: 'Rajendra Naidu Block (R.J. Block)',
        floorNumber: 1,
        officeHours: '09:00 AM - 05:00 PM',
        designation: 'Principal & Professor',
        researchArea: 'Wireless Sensor Networks, Power Systems',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    },
    {
        id: 'f-2',
        name: 'Dr. Sethukarasi T',
        title: 'Head of Department',
        department: 'Computer Science & Engineering',
        email: 'hod.cse@rmkec.ac.in',
        phone: '+91 44 6790 6710',
        cabinNumber: 'NEW-201',
        buildingId: 'b-new',
        buildingName: 'New Academic Block',
        floorNumber: 2,
        officeHours: '10:00 AM - 04:30 PM',
        designation: 'Professor & HOD CSE',
        researchArea: 'Artificial Intelligence, Deep Learning, Image Processing',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
    },
    {
        id: 'f-3',
        name: 'Dr. K. Vijaya',
        title: 'Head of Department',
        department: 'Information Technology',
        email: 'hod.it@rmkec.ac.in',
        phone: '+91 44 6790 6720',
        cabinNumber: 'SV-105',
        buildingId: 'b-sv',
        buildingName: 'Srinivasa Block (S.V. Block)',
        floorNumber: 1,
        officeHours: '09:30 AM - 04:30 PM',
        designation: 'Professor & HOD IT',
        researchArea: 'Cloud Computing, Cyber Security, Big Data Analytics',
        photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'
    },
    {
        id: 'f-4',
        name: 'Dr. N. M. Jothi Swaroopan',
        title: 'Head of Department',
        department: 'Electrical & Electronics Engineering',
        email: 'hod.eee@rmkec.ac.in',
        phone: '+91 44 6790 6730',
        cabinNumber: 'NEW-108',
        buildingId: 'b-new',
        buildingName: 'New Academic Block',
        floorNumber: 1,
        officeHours: '10:00 AM - 05:00 PM',
        designation: 'Professor & HOD EEE',
        researchArea: 'Renewable Energy, Smart Grids, Power Electronics',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
    },
    {
        id: 'f-5',
        name: 'Dr. T. Suresh',
        title: 'Head of Department',
        department: 'Electronics & Communication',
        email: 'hod.ece@rmkec.ac.in',
        phone: '+91 44 6790 6740',
        cabinNumber: 'SV-202',
        buildingId: 'b-sv',
        buildingName: 'Srinivasa Block (S.V. Block)',
        floorNumber: 2,
        officeHours: '09:30 AM - 04:30 PM',
        designation: 'Professor & HOD ECE',
        researchArea: 'VLSI Design, Signal Processing, IoT Systems',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
    }
];

export const BUS_ROUTES: BusRoute[] = [
    {
        id: 'bus-01',
        routeNumber: 'R-12',
        routeName: 'Koyambedu / Anna Nagar Express',
        busNumber: 'TN 20 BK 1995',
        driverContact: '+91 94441 23456',
        status: 'On Time',
        nextArrivalMinutes: 5,
        stops: [
            { name: 'Koyambedu Flyover', time: '06:15 AM', isPassed: true },
            { name: 'Anna Nagar Roundtana', time: '06:25 AM', isPassed: true },
            { name: 'Retteri Junction', time: '06:45 AM', isPassed: true },
            { name: 'Redhills Gate', time: '07:10 AM', isPassed: true },
            { name: 'Kavaraipettai RMK Campus', time: '07:45 AM', isPassed: false }
        ]
    },
    {
        id: 'bus-02',
        routeNumber: 'R-24',
        routeName: 'Tambaram / Guindy Shuttle',
        busNumber: 'TN 20 CZ 2001',
        driverContact: '+91 94442 87654',
        status: 'Approaching Kiosk',
        nextArrivalMinutes: 2,
        stops: [
            { name: 'Tambaram East', time: '06:00 AM', isPassed: true },
            { name: 'Guindy TVK Industrial Estate', time: '06:20 AM', isPassed: true },
            { name: 'Central Station', time: '06:45 AM', isPassed: true },
            { name: 'Kavaraipettai RMK Campus', time: '07:45 AM', isPassed: false }
        ]
    },
    {
        id: 'bus-03',
        routeNumber: 'R-05',
        routeName: 'Thiruvallur / Avadi Route',
        busNumber: 'TN 20 DW 2012',
        driverContact: '+91 94443 11223',
        status: 'In Transit',
        nextArrivalMinutes: 12,
        stops: [
            { name: 'Thiruvallur Bus Stand', time: '06:30 AM', isPassed: true },
            { name: 'Avadi Check Post', time: '06:50 AM', isPassed: true },
            { name: 'Thiruvalangadu', time: '07:15 AM', isPassed: false },
            { name: 'Kavaraipettai RMK Campus', time: '07:50 AM', isPassed: false }
        ]
    }
];

export const HOSTELS: Hostel[] = [
    {
        id: 'h-gents',
        name: 'RMK Gents Residence (Brahmaputra & Kaveri)',
        code: 'BH-MAIN',
        type: 'Boys',
        capacity: 1200,
        wardenName: 'Prof. R. Gunasekaran',
        wardenContact: '+91 44 6790 6780',
        buildingId: 'b-h-gents',
        messSchedule: [
            { day: 'Monday', breakfast: 'Idli, Sambar, Vada, Chutney, Coffee/Tea', lunch: 'South Indian Veg Meals, Special Poriyal, Curd', snacks: 'Samosa, Tea/Milk', dinner: 'Chapathi, Paneer Butter Masala, Rice, Milk' },
            { day: 'Tuesday', breakfast: 'Puri, Potato Masala, Coffee/Tea', lunch: 'Variety Rice (Lemon/Tomato), Appalam, Curd Rice', snacks: 'Sundal, Tea', dinner: 'Dosai, Sambar, Chutney, Fruit' },
            { day: 'Wednesday', breakfast: 'Pongal, Medu Vada, Chutney', lunch: 'Full South Indian Meals, Payasam', snacks: 'Bajji, Tea', dinner: 'Parotta, Veg Kurma, Milk' },
            { day: 'Thursday', breakfast: 'Rava Upma, Coconut Chutney', lunch: 'Sambar Rice, Rasam, Potato Fry, Curd', snacks: 'Cake/Biscuits, Tea', dinner: 'Idiyappam, Coconut Milk, Rice' },
            { day: 'Friday', breakfast: 'Masala Dosa, Sambar', lunch: 'Special Meals, Veg Biryani, Raita', snacks: 'Cutlet, Tea', dinner: 'Chola Bhatura, Sweet, Milk' }
        ],
        rules: [
            'Hostel main gate closes strictly at 7:30 PM.',
            'Biometric attendance mandatory before 8:30 PM.',
            'Wi-Fi study hours: 8:30 PM - 11:00 PM.',
            'Zero tolerance for ragging or loud audio speakers.'
        ],
        facilities: ['High-Speed Fiber Wi-Fi', '24/7 Hot Water (Solar)', 'Gymnasium & Table Tennis', 'Reading Room with Dailies', 'In-house Laundry Service']
    },
    {
        id: 'h-ladies',
        name: 'RMK Ladies Residence (Ganga & Yamuna)',
        code: 'GH-MAIN',
        type: 'Girls',
        capacity: 1000,
        wardenName: 'Dr. M. Sridevi',
        wardenContact: '+91 44 6790 6785',
        buildingId: 'b-h-ladies',
        messSchedule: [
            { day: 'Monday', breakfast: 'Idli, Sambar, Chutney, Milk/Coffee', lunch: 'South Indian Thali, Poriyal, Curd', snacks: 'Cake, Tea', dinner: 'Chapathi, Dal Fry, Rice, Milk' },
            { day: 'Tuesday', breakfast: 'Set Dosa, Vadacarry, Coffee', lunch: 'Variety Rice, Potato Chips, Curd', snacks: 'Pani Puri / Sundal', dinner: 'Puri, Veg Kurma, Fruit' },
            { day: 'Wednesday', breakfast: 'Ven Pongal, Vada, Chutney', lunch: 'Special Meals, Sweet Pongal', snacks: 'Veg Samosa, Tea', dinner: 'Uttapam, Tomato Chutney, Milk' }
        ],
        rules: [
            'Entry allowed until 7:00 PM with biometric check.',
            'Parent permission required for outing passes.',
            'Quiet hours observed post 10:00 PM.'
        ],
        facilities: ['Biometric Access Security', 'Indoor Badminton Court', 'Air-Conditioned Study Lounge', 'Medical Station with Nurse', 'Laundromat']
    }
];

export const CAMPUS_EVENTS: CampusEvent[] = [
    {
        id: 'ev-1',
        title: 'National Level Technical Symposium - CYBERNAUT 2026',
        category: 'Hackathon',
        date: 'Sept 25, 2026',
        time: '09:00 AM - 04:30 PM',
        location: 'RMK Grand Auditorium & New Block',
        buildingId: 'b-aud',
        description: 'Flagship technical symposium presented by CSE & AI/DS departments with 24-hour hackathon, AI project expo, and paper presentation.',
        speaker: 'Chief Guest: Vice President, Cognizant Technology Solutions',
        organizer: 'Department of Computer Science & Engineering',
        registrationStatus: 'Open'
    },
    {
        id: 'ev-2',
        title: 'AICTE IDEA Lab Innovation Expo & Pitching Summit',
        category: 'Workshop',
        date: 'Oct 08, 2026',
        time: '10:00 AM - 03:30 PM',
        location: 'AICTE IDEA Lab (RJ Block)',
        buildingId: 'b-rj',
        description: 'Inter-college prototype demonstration featuring 3D printed IoT products, autonomous drones, and smart agriculture devices.',
        speaker: 'Dr. K. A. Mohamed Junaid, Principal',
        organizer: 'RMK AICTE IDEA Lab Steering Committee',
        registrationStatus: 'Open'
    },
    {
        id: 'ev-3',
        title: 'Mega Campus Placement Drive 2027 Batch',
        category: 'Placement Drive',
        date: 'Oct 15, 2026',
        time: '08:30 AM - 06:00 PM',
        location: 'Swaminatha Naidu Block & RJ Block',
        buildingId: 'b-sn',
        description: 'On-campus recruitment drive by Tier-1 IT & Core multinationals including TCS, Infosys, Wipro, Cognizant, and Zoho.',
        speaker: 'Director, Training & Placement Cell',
        organizer: 'Training & Placement Division',
        registrationStatus: 'Open'
    }
];

export const ADMISSION_COURSES: AdmissionCourse[] = [
    {
        id: 'c-cse',
        degree: 'B.E.',
        branch: 'Computer Science & Engineering',
        durationYears: 4,
        eligibility: 'Pass in 10+2 with Physics, Chemistry & Mathematics (TNEA Single Window / Management Counseling)',
        annualFee: 85000,
        intakeCapacity: 240
    },
    {
        id: 'c-ads',
        degree: 'B.Tech',
        branch: 'Artificial Intelligence & Data Science',
        durationYears: 4,
        eligibility: 'Pass in 10+2 with minimum 50% aggregate in PCM',
        annualFee: 85000,
        intakeCapacity: 120
    },
    {
        id: 'c-ece',
        degree: 'B.E.',
        branch: 'Electronics & Communication Engineering',
        durationYears: 4,
        eligibility: 'Pass in 10+2 with PCM subjects',
        annualFee: 85000,
        intakeCapacity: 180
    },
    {
        id: 'c-eee',
        degree: 'B.E.',
        branch: 'Electrical & Electronics Engineering',
        durationYears: 4,
        eligibility: 'Pass in 10+2 with PCM subjects',
        annualFee: 80000,
        intakeCapacity: 120
    },
    {
        id: 'c-it',
        degree: 'B.Tech',
        branch: 'Information Technology',
        durationYears: 4,
        eligibility: 'Pass in 10+2 with PCM subjects',
        annualFee: 85000,
        intakeCapacity: 120
    },
    {
        id: 'c-csbs',
        degree: 'B.Tech',
        branch: 'Computer Science & Business Systems (TCS Powered)',
        durationYears: 4,
        eligibility: 'Pass in 10+2 with PCM subjects',
        annualFee: 90000,
        intakeCapacity: 60
    }
];

export const ANALYTICS_STATS: AnalyticsStats = {
    totalVisitorsToday: 1482,
    avgSessionDurationSeconds: 215,
    activeVoiceQueries: 489,
    topSearchedBuildings: [
        { name: 'New Academic Block (CSE/ADS)', count: 420 },
        { name: 'Swaminatha Naidu Block (Library)', count: 345 },
        { name: 'R.J. Block (Admin & IDEA Lab)', count: 298 },
        { name: 'RMK Grand Auditorium', count: 210 },
        { name: 'Gents & Ladies Hostels', count: 180 }
    ],
    frequentFaqs: [
        { question: 'Where is the CSE Department & HOD Cabin?', count: 284 },
        { question: 'How do I reach the Central Library & Computer Centre?', count: 241 },
        { question: 'Where is the AICTE IDEA Lab located?', count: 198 },
        { question: 'Which bus route goes to Anna Nagar / Koyambedu?', count: 165 },
        { question: 'Where is the Principal Office in RJ Block?', count: 142 }
    ],
    languageUsage: [
        { lang: 'English', percentage: 65 },
        { lang: 'Tamil', percentage: 28 },
        { lang: 'Hindi', percentage: 5 },
        { lang: 'Telugu', percentage: 2 }
    ],
    hourlyTraffic: [
        { hour: '08 AM', count: 120 },
        { hour: '09 AM', count: 310 },
        { hour: '10 AM', count: 240 },
        { hour: '11 AM', count: 190 },
        { hour: '12 PM', count: 175 },
        { hour: '01 PM', count: 210 },
        { hour: '02 PM', count: 260 },
        { hour: '03 PM', count: 180 },
        { hour: '04 PM', count: 140 }
    ]
};

export const FACULTY_MEMBERS = FACULTY_LIST;
export const ANALYTICS_DATA = ANALYTICS_STATS;

