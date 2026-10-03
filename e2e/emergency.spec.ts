import {test,expect,Page} from '@playwright/test';
const password=process.env.QURA_E2E_PASSWORD||'SyntheticE2EPass9!';
async function login(page:Page,email:string,role:string){
 await page.goto('/');
 const portal=role==='admin'?'Administrator sign in':role==='doctor'?'Doctor Portal':role==='driver'?'Ambulance driver':role==='hospital'?'Receiving hospital':'Patient Portal';
 await page.getByRole('button',{name:portal,exact:true}).click();
 await page.getByLabel('Email address').fill(email);await page.getByLabel('Password',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Sign in securely'}).click();await expect(page.getByRole('heading',{name:/Welcome,/})).toBeVisible();
}
async function openCase(page:Page,id:string){
 await page.locator('aside nav').getByRole('button',{name:'Emergency cases',exact:true}).click();
 await page.locator('.case-list button').filter({hasText:id}).click();
 await expect(page.locator('.emergency-detail')).toBeVisible();
}

test('all five roles complete consultation, dispatch, live tracking, hospital acceptance and admission',async({browser})=>{
 test.setTimeout(120000);
 const contexts=await Promise.all(Array.from({length:5},()=>browser.newContext()));
 const [patient,doctor,admin,driver,hospital]=await Promise.all(contexts.map(c=>c.newPage()));
 const crashes:string[]=[];for(const page of [patient,doctor,admin,driver,hospital])page.on('pageerror',e=>crashes.push(e.message));
 try{
  await login(patient,'patient2@qura.demo','patient');
  await patient.getByRole('button',{name:'Health profile',exact:true}).click();
  await patient.getByLabel('Symptoms and reason for consultation').fill('Synthetic symptoms for the end-to-end transport demonstration.');
  await patient.getByRole('checkbox').check();await patient.getByRole('button',{name:'Save health profile',exact:true}).click();
  await expect(patient.getByRole('status')).toContainText('sharing preference saved');
  await patient.getByRole('button',{name:'Consultations',exact:true}).click();
  const reason=`Synthetic emergency consultation ${Date.now()}`;
  await patient.getByLabel('Consultation reason').fill(reason);
  await patient.getByRole('button',{name:'Send consultation request',exact:true}).click();
  await expect(patient.getByRole('status')).toContainText('request sent');
  await login(doctor,'doctor1@qura.demo','doctor');await doctor.getByRole('button',{name:'Consultations',exact:true}).click();
  await doctor.locator('.case-list button').filter({hasText:reason}).click();
  await expect(doctor.getByText('Shared patient profile',{exact:true})).toBeVisible();
  await doctor.getByLabel('Consultation notes').fill('Synthetic review by a human doctor. No automated diagnosis.');
  await doctor.getByLabel('Consultation outcome',{exact:true}).selectOption('emergency');
  await doctor.getByRole('button',{name:'Record consultation outcome',exact:true}).click();
  await expect(doctor.getByText('Doctor-initiated emergency referral',{exact:true})).toBeVisible();
  await doctor.getByLabel('Pickup address',{exact:true}).fill('Synthetic Chennai pickup point');
  await doctor.getByLabel('Transport requirements',{exact:true}).fill('Synthetic general transport considerations.');
  await doctor.getByLabel('Referral observations',{exact:true}).fill('Synthetic emergency referral after human review.');
  await doctor.getByRole('button',{name:'Send emergency referral to administration',exact:true}).click();
  await expect(doctor.locator('.consultation-detail .alert')).toContainText('Emergency case Q-');
  const allCases=await doctor.request.get('/api/emergency/cases').then(r=>r.json());
  const created=allCases.find((c:any)=>c.patient_name==='Synthetic Participant Two');expect(created).toBeTruthy();const id=created.id;
  await login(admin,'admin@qura.demo','admin');await openCase(admin,id);
  await admin.getByRole('button',{name:'Verify referral',exact:true}).click();
  await admin.getByLabel('Available ambulance',{exact:true}).selectOption({label:'Demo Ambulance 01'});
  await admin.getByRole('button',{name:'Assign ambulance',exact:true}).click();
  await login(driver,'driver1@qura.demo','driver');await openCase(driver,id);
  await driver.getByRole('button',{name:'Accept dispatch',exact:true}).click();
  await driver.getByRole('button',{name:'Begin journey to patient',exact:true}).click();
  await openCase(patient,id);await expect(patient.locator('.live-indicator')).toContainText('Live case feed connected');
  await driver.getByLabel('Ambulance latitude',{exact:true}).fill('13.046');await driver.getByLabel('Ambulance longitude',{exact:true}).fill('80.225');
  await driver.getByRole('button',{name:'Send manual demo position',exact:true}).click();
  await expect(patient.locator('.case-timeline')).toContainText('location updated');
  await driver.getByRole('button',{name:'Confirm arrived at pickup',exact:true}).click();
  await driver.getByRole('button',{name:'Confirm patient onboard',exact:true}).click();
  await driver.getByRole('button',{name:'Rank hospital options',exact:true}).click();
  const hospitalA=driver.locator('.hospital-option').filter({hasText:'Demo Hospital A'});
  await expect(hospitalA).toContainText('No suitable reported free bed');
  await expect(hospitalA.getByRole('button',{name:'Request hospital acceptance'})).toBeDisabled();
  await driver.locator('.hospital-option').filter({hasText:'Demo Hospital B'}).getByRole('button',{name:'Request hospital acceptance'}).click();
  await expect(driver.getByRole('button',{name:'Begin journey to hospital',exact:true})).toHaveCount(0);
  await login(hospital,'hospital2@qura.demo','hospital');await openCase(hospital,id);
  await hospital.getByRole('button',{name:'Confirm capacity and accept case',exact:true}).click();
  await hospital.getByLabel('Case coordination note',{exact:true}).fill('Synthetic bed and receiving team ready.');
  await hospital.getByRole('button',{name:'Confirm bed and team ready',exact:true}).click();
  await expect(driver.locator('.care-summary').filter({hasText:'Demo Hospital B'})).toContainText('Team preparation: Ready');
  await driver.getByRole('button',{name:'Begin journey to hospital',exact:true}).click();
  await expect(patient.locator('.emergency-detail h3').first()).toContainText('En route to hospital');
  await expect(driver.locator('.route-summary')).toContainText('Simulated estimated travel time');
  await driver.getByRole('button',{name:'Zoom in map',exact:true}).click();await driver.getByRole('button',{name:'Reset map',exact:true}).click();
  await driver.screenshot({path:'tmp/qa-emergency-driver-desktop.png',fullPage:true});
  await driver.setViewportSize({width:390,height:844});await driver.screenshot({path:'tmp/qa-emergency-driver-mobile.png',fullPage:true});
  expect(await driver.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await driver.getByRole('button',{name:'Confirm arrived at hospital',exact:true}).click();
  await hospital.getByRole('button',{name:'Receiving team confirms arrival',exact:true}).click();
  await driver.getByLabel('Case coordination note',{exact:true}).fill('Synthetic handover to receiving hospital staff.');
  await driver.getByRole('button',{name:'Record patient handover',exact:true}).click();
  await hospital.getByLabel('Admission bed assignment',{exact:true}).fill('SYNTHETIC-BED-01');
  await hospital.getByRole('button',{name:'Record admission and close case',exact:true}).click();
  await expect(patient.locator('.emergency-detail h3').first()).toContainText('case closed');
  await expect(patient.getByText('Bed assignment: SYNTHETIC-BED-01',{exact:true})).toBeVisible();
  const final=await admin.request.get(`/api/emergency/cases/${id}`).then(r=>r.json());
  expect(final.status).toBe('closed');expect(final.timeline.at(-1).action).toBe('admit');expect(final.hospital_accepted).toBe(true);
  expect(crashes).toEqual([]);
 }finally{await Promise.all(contexts.map(c=>c.close()));}
});

test('assistant captures structured symptoms and offers a consent-scoped consultation request',async({page})=>{
 await login(page,'patient1@qura.demo','patient');await page.getByRole('button',{name:'Assistant',exact:true}).first().click();
 await page.getByRole('button',{name:'Describe symptoms',exact:true}).click();
 await page.getByLabel('Describe symptoms',{exact:true}).fill('Synthetic symptoms described by the participant.');
 await page.getByLabel('When did this begin?',{exact:true}).fill('Synthetic timing');
 await page.getByRole('button',{name:'Save symptom description',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Structured symptom description saved');
 await page.getByRole('button',{name:'Request doctor consultation',exact:true}).click();
 await page.getByLabel('Consultation reason',{exact:true}).fill('Synthetic assistant-linked consultation request.');
 await page.getByRole('button',{name:'Send consultation request',exact:true}).click();
 await expect(page.locator('.consultation-request [role=status]')).toContainText('request sent');
});

for(const role of ['driver','hospital'])test(`${role} navigation and resources resize and retain role access`,async({page})=>{
 await login(page,role==='driver'?'driver2@qura.demo':'hospital3@qura.demo',role);
 const sections=role==='driver'?['Dashboard','Emergency cases','Fleet & hospitals']:['Dashboard','Emergency cases','Hospital capacity'];
 const crashes:string[]=[];page.on('pageerror',e=>crashes.push(e.message));
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:600});for(const section of sections){
   await page.locator('aside nav').getByRole('button',{name:section,exact:true}).click();
   await expect(page.locator('header strong')).toHaveText(section);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
   await expect(page.locator('aside').getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
  }
 }
 expect(await page.request.get('/api/models').then(r=>r.status())).toBe(403);
 expect(await page.request.get('/api/admin/users').then(r=>r.status())).toBe(403);
 expect(crashes).toEqual([]);
});
