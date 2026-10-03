import {describe,it,expect} from 'vitest';
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';
import te from '../locales/te.json';
import ml from '../locales/ml.json';
import kn from '../locales/kn.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import ar from '../locales/ar.json';
describe('language catalogs',()=>{
 it('keeps all keys aligned with an explicit English fallback',()=>{
  for(const catalog of [ta,hi,te,ml,kn,es,fr,ar])expect(Object.keys(catalog).sort()).toEqual(Object.keys(en).sort());
 });
});
