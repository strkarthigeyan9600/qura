import React, { createContext, useContext, useState } from 'react';
import { LanguageCode } from '../types';

export interface Language {
    code: LanguageCode;
    name: string;
    nativeName: string;
    flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' }
];

const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
    en: {
        welcome: 'Welcome to Smart AI Campus Concierge',
        tagline: 'Interactive Navigation • Voice Assistant • Student & Visitor Self-Service Kiosk',
        aiAssistant: 'AI Assistant',
        campusMap: 'Campus Map & 3D Route',
        facultyFinder: 'Faculty Finder',
        busRoutes: 'Bus Routes & Live Status',
        hostels: 'Hostel & Mess Menu',
        admissions: 'Admissions & Courses',
        events: 'Events & Hackathons',
        emergency: 'EMERGENCY SOS',
        analytics: 'Kiosk Analytics',
        adminDashboard: 'Admin Control Panel',
        askAnything: 'Ask the AI Assistant anything about campus...',
        quickQuestions: 'Quick Prompts:',
        searchPlaceholder: 'Search buildings, faculty, rooms, or topics...',
        youAreHere: 'You Are Here (Main Gate Kiosk)',
        startRoute: 'Start Guided Navigation',
        qrHandoff: 'Transfer to Phone (QR)',
        accessibleRoute: 'Wheelchair / Elevator Route',
        walkingTime: 'Est. Walking Time'
    },
    hi: {
        welcome: 'स्मार्ट एआई कैंपस कंसीयज में आपका स्वागत है',
        tagline: 'इंटरएक्टिव नेविगेशन • वॉयस असिस्टेंट • छात्र और आगंतुक कियोस्क',
        aiAssistant: 'एआई सहायक',
        campusMap: 'कैंपस मानचित्र और मार्ग',
        facultyFinder: 'संकाय खोजक (Faculty)',
        busRoutes: 'बस मार्ग और लाइव स्थिति',
        hostels: 'हॉस्टल और मैस मेनू',
        admissions: 'प्रवेश और पाठ्यक्रम',
        events: 'कार्यक्रम और हैकथॉन',
        emergency: 'आपातकालीन (SOS)',
        analytics: 'एनालिटिक्स',
        adminDashboard: 'एडमिन पैनल',
        askAnything: 'कैंपस के बारे में एआई सहायक से कुछ भी पूछें...',
        quickQuestions: 'त्वरित प्रश्न:',
        searchPlaceholder: 'भवन, संकाय या कमरे खोजें...',
        youAreHere: 'आप यहाँ हैं (मुख्य द्वार कियोस्क)',
        startRoute: 'नेविगेशन शुरू करें',
        qrHandoff: 'फोन पर ट्रांसफर करें (QR)',
        accessibleRoute: 'व्हीलचेयर / लिफ्ट मार्ग',
        walkingTime: 'अनुमानित समय'
    },
    es: {
        welcome: 'Bienvenido al Concierge del Campus IA',
        tagline: 'Navegación Interactiva • Asistente de Voz • Kiosco de Autoservicio',
        aiAssistant: 'Asistente IA',
        campusMap: 'Mapa del Campus',
        facultyFinder: 'Profesores',
        busRoutes: 'Rutas de Autobús',
        hostels: 'Residencias y Menú',
        admissions: 'Admisiones',
        events: 'Eventos',
        emergency: 'EMERGENCIA SOS',
        analytics: 'Analítica',
        adminDashboard: 'Panel de Administración',
        askAnything: 'Pregunta cualquier cosa sobre el campus...',
        quickQuestions: 'Preguntas rápidas:',
        searchPlaceholder: 'Buscar edificios, profesores, aulas...',
        youAreHere: 'Usted está aquí',
        startRoute: 'Iniciar navegación',
        qrHandoff: 'Transferir al teléfono (QR)',
        accessibleRoute: 'Ruta accesible',
        walkingTime: 'Tiempo estimado'
    },
    fr: {
        welcome: 'Bienvenue sur le Concierge du Campus IA',
        tagline: 'Navigation Interactive • Assistant Vocal • Borne Libre-Service',
        aiAssistant: 'Assistant IA',
        campusMap: 'Carte du Campus',
        facultyFinder: 'Proffesseurs',
        busRoutes: 'Lignes de Bus',
        hostels: 'Résidences',
        admissions: 'Admissions',
        events: 'Événements',
        emergency: 'URGENCE SOS',
        analytics: 'Analytique',
        adminDashboard: 'Panneau Admin',
        askAnything: 'Posez n\'importe quelle question sur le campus...',
        quickQuestions: 'Questions rapides:',
        searchPlaceholder: 'Rechercher des bâtiments, enseignants...',
        youAreHere: 'Vous êtes ici',
        startRoute: 'Démarrer la navigation',
        qrHandoff: 'Transférer au téléphone (QR)',
        accessibleRoute: 'Itinéraire accessible',
        walkingTime: 'Temps estimé'
    },
    de: {
        welcome: 'Willkommen beim Smart AI Campus Concierge',
        tagline: 'Interaktive Navigation • Sprachassistent • Selbstbedienungskiosk',
        aiAssistant: 'KI-Assistent',
        campusMap: 'Campusplan',
        facultyFinder: 'Dozentenfinder',
        busRoutes: 'Buslinien & Live-Status',
        hostels: 'Wohnheim & Speiseplan',
        admissions: 'Zulassung & Kurse',
        events: 'Veranstaltungen',
        emergency: 'NOTFALL SOS',
        analytics: 'Analytik',
        adminDashboard: 'Admin-Panel',
        askAnything: 'Fragen Sie den KI-Assistenten alles über den Campus...',
        quickQuestions: 'Schnellfragen:',
        searchPlaceholder: 'Gebäude, Dozenten, Räume suchen...',
        youAreHere: 'Sie sind hier',
        startRoute: 'Navigation starten',
        qrHandoff: 'Auf Smartphone übertragen (QR)',
        accessibleRoute: 'Barrierefreie Route',
        walkingTime: 'Geschätzte Gehzeit'
    },
    ja: {
        welcome: 'スマートAIキャンパス・コンシェルジュへようこそ',
        tagline: 'インタラクティブナビゲーション • 音声アシスタント • キオスク端末',
        aiAssistant: 'AIアシスタント',
        campusMap: 'キャンパスマップ',
        facultyFinder: '教員検索',
        busRoutes: 'バス路線',
        hostels: '寮・食堂メニュー',
        admissions: '入学案内',
        events: 'イベント',
        emergency: '緊急SOS',
        analytics: 'アナリティクス',
        adminDashboard: '管理者パネル',
        askAnything: 'キャンパスについてAIに質問する...',
        quickQuestions: 'クイック質問:',
        searchPlaceholder: '建物、教員、教室を検索...',
        youAreHere: '現在地',
        startRoute: 'ナビゲーション開始',
        qrHandoff: 'スマホに転送 (QR)',
        accessibleRoute: 'バリアフリールート',
        walkingTime: '徒歩所要時間'
    },
    zh: {
        welcome: '欢迎使用智能 AI 校园礼宾系统',
        tagline: '交互式导航 • 语音助手 • 校园自助服务机',
        aiAssistant: 'AI 助手',
        campusMap: '校园地图',
        facultyFinder: '教职工查询',
        busRoutes: '班车路线',
        hostels: '宿舍与食堂菜单',
        admissions: '招生与课程',
        events: '校园活动',
        emergency: '紧急求助 SOS',
        analytics: '数据分析',
        adminDashboard: '管理控制台',
        askAnything: '向 AI 助手咨询关于校园的任何问题...',
        quickQuestions: '快捷问题:',
        searchPlaceholder: '搜索建筑物、教师、教室...',
        youAreHere: '您在此处',
        startRoute: '开始导航',
        qrHandoff: '传送至手机 (QR)',
        accessibleRoute: '无障碍路线',
        walkingTime: '预计步行时间'
    },
    mr: {
        welcome: 'स्मार्ट एआय कॅम्पस कॉन्सिर्जमध्ये आपले स्वागत आहे',
        tagline: 'इंटरअॅक्टिव्ह नॅव्हिगेशन • व्हॉइस असिस्टंट • विद्यार्थी व अभ्यागत किओस्क',
        aiAssistant: 'एआय सहाय्यक',
        campusMap: 'कॅम्पस नकाशा',
        facultyFinder: 'प्राध्यापक शोध',
        busRoutes: 'बस मार्ग',
        hostels: 'वसतिगृह व मेस मेनू',
        admissions: 'प्रवेश व अभ्यासक्रम',
        events: 'कार्यक्रम',
        emergency: 'आणीबाणी (SOS)',
        analytics: 'अॅनालिटिक्स',
        adminDashboard: 'अॅडमिन पॅनेल',
        askAnything: 'कॅम्पसबद्दल एआय सहाय्यकाला काहीही विचारा...',
        quickQuestions: 'त्वरित प्रश्न:',
        searchPlaceholder: 'इमारती, प्राध्यापक किंवा खोल्या शोधा...',
        youAreHere: 'आपण येथे आहात',
        startRoute: 'मार्ग सुरू करा',
        qrHandoff: 'फोनवर ट्रान्सफर करा (QR)',
        accessibleRoute: 'व्हीलचेअर / लिफ्ट मार्ग',
        walkingTime: 'अंदाजे वेळ'
    },
    ta: {
        welcome: 'ஸ்மார்ட் AI கேம்பஸ் வரவேற்பிற்கு நல்வரவு',
        tagline: 'ஊடாடும் வழிசெலுத்தல் • குரல் உதவியாளர் • சுய சேவை கியோஸ்க்',
        aiAssistant: 'AI உதவியாளர்',
        campusMap: 'வளாக வரைபடம்',
        facultyFinder: 'பேராசிரியர் தேடல்',
        busRoutes: 'பேருந்து பாதைகள்',
        hostels: 'விடுதி மற்றும் உணவு மெனு',
        admissions: 'சேர்க்கை',
        events: 'நிகழ்வுகள்',
        emergency: 'அவசர நிலை (SOS)',
        analytics: 'பகுப்பாய்வு',
        adminDashboard: 'நிர்வாக குழு',
        askAnything: 'வளாகத்தைப் பற்றி எது வேண்டுமானாலும் கேளுங்கள்...',
        quickQuestions: 'விரைவான கேள்விகள்:',
        searchPlaceholder: 'கட்டிடங்கள், பேராசிரியர்களைத் தேடுக...',
        youAreHere: 'நீங்கள் இங்கே இருக்கிறீர்கள்',
        startRoute: 'வழிகாட்டுதலைத் தொடங்கு',
        qrHandoff: 'போனுக்கு மாற்றவும் (QR)',
        accessibleRoute: 'சக்கர நாற்காலி பாதை',
        walkingTime: 'மதிப்பிடப்பட்ட நேரம்'
    },
    te: {
        welcome: 'స్మార్ట్ AI క్యాంపస్ కాన్సియర్జ్‌కి స్వాగతం',
        tagline: 'ఇంటరాక్టివ్ నేవిగేషన్ • వాయిస్ అసిస్టెంట్ • స్వీయ సేవా కియోస్క్',
        aiAssistant: 'AI అసిస్టెంట్',
        campusMap: 'క్యాంపస్ మ్యాప్',
        facultyFinder: 'ఫ్యాకల్టీ శోధన',
        busRoutes: 'బస్సు మార్గాలు',
        hostels: 'హాస్టల్ & మెస్ మెనూ',
        admissions: 'అడ్మిషన్లు',
        events: 'ఈవెంట్లు',
        emergency: 'అత్యవసర పరిస్థితి (SOS)',
        analytics: 'అనలిటిక్స్',
        adminDashboard: 'అడ్మిన్ ప్యానెల్',
        askAnything: 'క్యాంపస్ గురించి AI అసిస్టెంట్‌ని ఏమైనా అడగండి...',
        quickQuestions: 'త్వరిత ప్రశ్నలు:',
        searchPlaceholder: 'భవనాలు, ఫ్యాకల్టీ శోధించండి...',
        youAreHere: 'మీరు ఇక్కడ ఉన్నారు',
        startRoute: 'నేవిగేషన్ ప్రారంభించండి',
        qrHandoff: 'ఫోన్‌కు బదిలీ చేయండి (QR)',
        accessibleRoute: 'వీల్‌చైర్ / లిఫ్ట్ మార్గం',
        walkingTime: 'అంచనా వేసిన సమయం'
    }
};

interface LanguageContextType {
    currentLanguage: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');

    const t = (key: string): string => {
        const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
        return dict[key] || TRANSLATIONS.en[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, setLanguage: setCurrentLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
};
