import React from 'react';
import i18next from 'i18next';
import {initReactI18next,useTranslation} from 'react-i18next';
import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import ml from './locales/ml.json';
import kn from './locales/kn.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import {request,useSession} from './session';

export const languages=[['en','English'],['ta','தமிழ்'],['hi','हिन्दी'],['te','తెలుగు'],['ml','മലയാളം'],['kn','ಕನ್ನಡ'],['es','Español'],['fr','Français'],['ar','العربية']];
void i18next.use(initReactI18next).init({resources:Object.fromEntries(Object.entries({en,ta,hi,te,ml,kn,es,fr,ar}).map(([code,translation])=>[code,{translation}])),lng:localStorage.getItem('qura-language')||'en',fallbackLng:'en',keySeparator:false,nsSeparator:false,interpolation:{escapeValue:false}});
function apply(code:string){document.documentElement.lang=code;document.documentElement.dir=code==='ar'?'rtl':'ltr';localStorage.setItem('qura-language',code);}
i18next.on('languageChanged',apply);apply(i18next.language||'en');
/** Natural-language keys remain in locale files, not component copy. */
export const tr=(key:string)=>i18next.t(key);
export {i18next};

/** Shared persisted language control; authenticated preferences stay server-side. */
export function LanguageSelector(){
 const {user,setUser}=useSession();const {i18n}=useTranslation();
 async function change(code:string){await i18n.changeLanguage(code);if(user){await request('/auth/me',{language_pref:code},'PATCH');setUser({...user,language_pref:code});}}
 return <label className="language-picker">{tr('Language')}<select aria-label={tr('Language')} value={i18n.language} onChange={e=>void change(e.target.value)}>{languages.map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label>;
}
