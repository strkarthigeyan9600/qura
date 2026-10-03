import {test,expect,Page} from '@playwright/test';
const password=process.env.QURA_E2E_PASSWORD||'SyntheticE2EPass9!';
async function login(page:Page,email:string,doctor=false){
 await page.goto('/');
 if(doctor)await page.getByRole('button',{name:'Doctor Portal',exact:true}).click();
 await page.getByLabel('Email address').fill(email);
 await page.getByLabel('Password',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Sign in securely'}).click();
 await expect(page.getByRole('heading',{name:/Welcome,/})).toBeVisible();
}
test('patient signup, consent, measurements, own report and safe chat',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'New here? Create an account'}).click();
 await page.getByLabel('Full name').fill('Synthetic E2E Participant');
 const email=`synthetic-${Date.now()}@test.local`;
 await page.getByLabel('Email address').fill(email);
 await page.getByLabel('Password',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Create account',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Account created');
 await page.getByRole('button',{name:'Sign in securely'}).click();
 await expect(page.getByRole('heading',{name:/Welcome,/})).toBeVisible();
 await page.getByRole('button',{name:'Consent',exact:true}).click();
 await page.getByRole('checkbox').check();
 await page.getByRole('button',{name:'Measurements',exact:true}).click();
 await page.getByRole('button',{name:'Fill synthetic demo'}).click();
 await page.getByRole('button',{name:'Create research report'}).click();
 await expect(page.getByText('Classical estimate',{exact:true})).toBeVisible({timeout:30000});
 await page.getByRole('button',{name:'My reports',exact:true}).click();
 await expect(page.locator('.report-list button')).toHaveCount(1);
 await page.getByRole('button',{name:'Assistant',exact:true}).first().click();
 await page.getByRole('button',{name:'Explain my result',exact:true}).click();
 await expect(page.locator('.chat-answer').last()).toContainText('research',{timeout:30000});
 expect(await page.request.get('/api/admin/users').then(r=>r.status())).toBe(403);
});
test('assigned doctor reviews and approves a synthetic case',async({page})=>{
 await login(page,'doctor1@qura.demo',true);
 await page.getByRole('button',{name:'Review queue',exact:true}).click();
 await expect(page.locator('.report-list button').first()).toBeVisible();
 await page.locator('.report-list button').first().click();
 await page.getByLabel('Review note').fill('Synthetic demo reviewed; model output is a research estimate.');
 await page.getByRole('button',{name:'Approve report'}).click();
 await expect(page.locator('.review-note')).toContainText('Synthetic demo reviewed');
 await expect(page.locator('.report-list')).toContainText('Reviewed');
});
test('patient owns history, can delete it and switch to Arabic RTL',async({page})=>{
 await login(page,'patient3@qura.demo');
 await page.getByRole('button',{name:'Assistant',exact:true}).first().click();
 await page.getByRole('button',{name:'What does confidence mean?'}).click();
 await expect(page.locator('.chat-answer')).toBeVisible();
 await page.getByRole('button',{name:'Delete chat history'}).click();
 await expect(page.locator('.chat-answer')).toHaveCount(0);
 await page.getByLabel('Language',{exact:true}).first().selectOption('ar');
 await expect(page.locator('html')).toHaveAttribute('dir','rtl');
 expect(await page.request.get('/api/models').then(r=>r.status())).toBe(403);
});

test('patient uploads a synthetic photo and assigned doctor sends a review',async({page,browser})=>{
 await login(page,'patient1@qura.demo');
 await page.getByRole('button',{name:'Photo review',exact:true}).click();
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
 await page.getByLabel('Photo file',{exact:true}).setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:png});
 await page.getByLabel('Optional description').fill('Synthetic test photo for human review.');
 await page.getByRole('checkbox').check();
 await page.getByRole('button',{name:'Send photo for review'}).click();
 await expect(page.getByRole('status')).toContainText('Photo sent');
 await expect(page.locator('.photo-card')).toHaveCount(1);
 const doctorContext=await browser.newContext();const doctorPage=await doctorContext.newPage();
 await login(doctorPage,'doctor1@qura.demo',true);
 await doctorPage.getByRole('button',{name:'Photo review',exact:true}).click();
 await doctorPage.locator('.photo-card').first().click();
 await doctorPage.getByLabel('Photo review note').fill('Synthetic photo reviewed. No automatic image diagnosis.');
 await doctorPage.getByRole('button',{name:'Send review to patient'}).click();
 await expect(doctorPage.locator('.review-note')).toContainText('Synthetic photo reviewed');
 await page.reload();
 await page.getByRole('button',{name:'Photo review',exact:true}).click();
 await page.locator('.photo-card').first().click();
 await expect(page.locator('.review-note')).toContainText('Synthetic photo reviewed');
 await doctorContext.close();
});

test('administrator keeps role navigation through every research tool',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Administrator sign in',exact:true}).click();
 await page.getByLabel('Email address').fill('admin@qura.demo');
 await page.getByLabel('Password',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Sign in securely'}).click();
 await expect(page.getByRole('heading',{name:/Welcome,/})).toBeVisible();
 await page.getByRole('button',{name:'Research tools',exact:true}).click();
 await expect(page.locator('.workspace strong')).toHaveText('Admin workspace');
 await expect(page.locator('header')).toContainText('Admin workspace');
 await expect(page.getByRole('button',{name:'Users & assignments',exact:true})).toBeVisible();
 for(const tool of ['Datasets','Preprocessing','Model training','Quantum circuit','Evaluation','Explainability','Predictions','Experiments','Documentation','Overview']){
  await page.locator('.research-tabs').getByRole('button',{name:tool,exact:true}).click();
  await expect(page.locator('.research-embedded h1')).toBeVisible();
  await expect(page.locator('.workspace strong')).toHaveText('Admin workspace');
 }
 await page.getByRole('button',{name:'Users & assignments',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Users & assignments',exact:true}).first()).toBeVisible();
 await expect(page.locator('.research-embedded')).toHaveCount(0);
});

test('selected login portal enforces the exact account role',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Administrator sign in',exact:true}).click();
 await page.getByLabel('Email address').fill('doctor1@qura.demo');
 await page.getByLabel('Password',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Sign in securely'}).click();
 await expect(page.getByRole('alert')).toContainText('Choose the portal');
 expect(await page.request.get('/api/auth/me').then(r=>r.status())).toBe(401);
});

for(const role of ['admin','doctor','patient'] as const){
 test(`${role} pages adapt at mobile, tablet and short desktop sizes`,async({page})=>{
  const crashes:string[]=[];page.on('pageerror',e=>crashes.push(e.message));
  if(role==='admin'){
   await page.goto('/');await page.getByRole('button',{name:'Administrator sign in',exact:true}).click();
   await page.getByLabel('Email address').fill('admin@qura.demo');await page.getByLabel('Password',{exact:true}).fill(password);
   await page.getByRole('button',{name:'Sign in securely'}).click();await expect(page.getByRole('heading',{name:/Welcome,/})).toBeVisible();
  }else await login(page,role==='doctor'?'doctor1@qura.demo':'patient1@qura.demo',role==='doctor');
  const pages=role==='admin'?['Dashboard','Users & assignments','Audit log','Emergency cases','Fleet & hospitals','Photo review','Research tools']:role==='doctor'?['Dashboard','My patients','Consultations','Emergency cases','Review queue','Photo review','Consensus Lab','Assistant','Research tools']:['Dashboard','Health profile','Consultations','Emergency cases','Measurements','Photo review','My reports','What-if lab','Assistant','Consent'];
  for(const width of [360,390,768,1024,1440]){
   await page.setViewportSize({width,height:600});
   for(const section of pages){
    await page.locator('aside nav').getByRole('button',{name:section,exact:true}).click();
    await expect(page.locator('header strong')).toHaveText(section);
    await expect(page.locator('aside').getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`${role}/${section} at ${width}px should not overflow`).toBe(true);
   }
   if(role!=='patient')for(const tool of ['Datasets','Model training','Quantum circuit','Evaluation','Explainability','Predictions','Experiments']){
    await page.locator('.research-tabs').getByRole('button',{name:tool,exact:true}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`${role}/${tool} at ${width}px should not overflow`).toBe(true);
   }
  }
  await page.getByLabel('Language',{exact:true}).first().selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  for(const width of [360,768,1024,1440]){await page.setViewportSize({width,height:600});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'RTL shell should not overflow').toBe(true);}
  await page.getByLabel('اللغة',{exact:true}).first().selectOption('en');
  expect(crashes).toEqual([]);
  if(role==='admin'){
   await page.setViewportSize({width:1440,height:900});await page.locator('.research-tabs').getByRole('button',{name:'Overview',exact:true}).click();
   await page.screenshot({path:'tmp/qa-admin-desktop.png',fullPage:true});
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tmp/qa-admin-mobile.png',fullPage:true});
  }
 });
}

test('administrator approves a registration and assigns a patient',async({page,browser})=>{
 const email=`doctor-approval-${Date.now()}@test.local`;
 await page.goto('/');await page.getByRole('button',{name:'Doctor Portal',exact:true}).click();
 await page.getByRole('button',{name:'New here? Create an account'}).click();
 await page.getByLabel('Full name').fill('Synthetic Approval Doctor');await page.getByLabel('Email address').fill(email);
 await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Create account',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('administrator must approve');
 await page.getByRole('button',{name:'Sign in securely'}).click();await expect(page.getByRole('alert')).toContainText('awaiting administrator approval');
 await page.getByRole('button',{name:'Administrator sign in',exact:true}).click();await page.getByLabel('Email address').fill('admin@qura.demo');
 await page.getByRole('button',{name:'Sign in securely'}).click();await expect(page.getByRole('heading',{name:/Welcome,/})).toBeVisible();
 await page.getByRole('button',{name:'Users & assignments',exact:true}).click();
 const row=page.getByRole('row').filter({hasText:email});await row.getByRole('button',{name:'Approve doctor'}).click();await expect(row).toContainText('Active');
 await page.getByLabel('Doctor',{exact:true}).selectOption({label:'Synthetic Approval Doctor'});
 const patientOption=page.getByLabel('Patient',{exact:true}).locator('option').filter({hasText:'Synthetic Participant One'});
 const patientId=await patientOption.getAttribute('value');expect(patientId).toBeTruthy();
 await page.getByLabel('Patient',{exact:true}).selectOption(patientId!);await page.getByRole('button',{name:'Save assignment'}).click();
 await expect(page.getByRole('alert')).toContainText('Assignment saved');
 const doctorContext=await browser.newContext();const doctorPage=await doctorContext.newPage();await login(doctorPage,email,true);
 await doctorPage.getByRole('button',{name:'My patients',exact:true}).click();await expect(doctorPage.getByRole('cell',{name:'Synthetic Participant One',exact:true})).toBeVisible();
 await doctorContext.close();
});

test('login and signup remain usable at narrow screen sizes',async({page})=>{
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:600});await page.goto('/');
  await expect(page.getByRole('button',{name:'Administrator sign in',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.getByRole('button',{name:'New here? Create an account'}).click();
  await expect(page.getByLabel('Full name')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 }
});
