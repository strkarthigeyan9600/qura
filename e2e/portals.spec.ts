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
