import {defineConfig} from '@playwright/test';
import {randomBytes,randomUUID} from 'node:crypto';
const password=process.env.QURA_E2E_PASSWORD||'SyntheticE2EPass9!';
export default defineConfig({
 testDir:'./e2e',workers:1,timeout:60000,fullyParallel:false,
 use:{baseURL:'http://127.0.0.1:3010',headless:true,trace:'retain-on-failure'},
 webServer:[
  {command:'python -m backend.seed_demo --train --reports --quick && python -m uvicorn backend.main:app --host 127.0.0.1 --port 5010',url:'http://127.0.0.1:5010/api/health',timeout:120000,reuseExistingServer:false,env:{QURA_STORAGE_DIR:'tmp/e2e-'+randomUUID(),QURA_JWT_SECRET:randomBytes(40).toString('hex'),QURA_DEMO_PASSWORD:password,QURA_ALLOWED_ORIGINS:'http://127.0.0.1:3010',QURA_EXTERNAL_AI_ENABLED:'false'}},
  {command:'npx vite --host 127.0.0.1 --port 3010 --strictPort',url:'http://127.0.0.1:3010',reuseExistingServer:false,env:{QURA_API_TARGET:'http://127.0.0.1:5010'}}
 ]
});
