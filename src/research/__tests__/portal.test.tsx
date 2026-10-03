// @vitest-environment jsdom
import React from 'react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import PortalApp from '../../PortalApp';
import {i18next} from '../i18n';
import {request} from '../session';
const reply=(value:unknown,status=200)=>Promise.resolve(new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}}));
beforeEach(async()=>{await i18next.changeLanguage('en');localStorage.clear();});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('real portal controls',()=>{
 it('keeps doctor registration pending and passes selected role to API',async()=>{
  const calls:Record<string,unknown>[]=[];
  vi.stubGlobal('fetch',vi.fn((url:string,options?:RequestInit)=>{
   if(url.endsWith('/register')){calls.push(JSON.parse(String(options?.body)));return reply({approved:0});}
   return reply({detail:'Sign in'},401);
  }));
  render(<PortalApp/>);
  fireEvent.click(await screen.findByRole('button',{name:'Doctor Portal'}));
  fireEvent.click(screen.getByRole('button',{name:'New here? Create an account'}));
  fireEvent.change(screen.getByLabelText('Full name'),{target:{value:'Demo Researcher'}});
  fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'new@test.local'}});
  fireEvent.change(screen.getByLabelText('Password'),{target:{value:'TestingPass123!'}});
  fireEvent.click(screen.getByRole('button',{name:'Create account'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('administrator must approve');
  expect(calls[0]).toMatchObject({role:'doctor',language_pref:'en'});
 });
 it('only renders patient navigation for the actual patient session',async()=>{
  vi.stubGlobal('fetch',vi.fn((url:string)=>reply(url.endsWith('/auth/me')?{id:'p1',name:'Test Participant',email:'p@test.local',role:'patient',approved:1,language_pref:'en'}:url.endsWith('/consent')?{granted:false}:[])));
  render(<PortalApp/>);
  expect(await screen.findByRole('heading',{name:'Welcome, Test.'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Research tools'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Consent'}));
  expect(screen.getByRole('checkbox')).not.toBeChecked();
 });
 it('changes document direction when Arabic is selected',async()=>{
  vi.stubGlobal('fetch',vi.fn(()=>reply({detail:'Sign in'},401)));
  render(<PortalApp/>);
  fireEvent.change(await screen.findByLabelText('Language'),{target:{value:'ar'}});
  await waitFor(()=>expect(document.documentElement.dir).toBe('rtl'));
 });
 it('refreshes expired access once and retries a protected request',async()=>{
  let attempts=0;
  const mocked=vi.fn((url:string)=>url.endsWith('/refresh')?reply({ok:true}):reply(++attempts===1?{detail:'Expired'}:{id:'own'},attempts===1?401:200));
  vi.stubGlobal('fetch',mocked);
  expect(await request('/reports/own')).toEqual({id:'own'});
  expect(mocked.mock.calls.filter(c=>String(c[0]).endsWith('/refresh'))).toHaveLength(1);
 });
});
