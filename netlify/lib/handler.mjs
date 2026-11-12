import {randomUUID} from 'node:crypto';
import {normalizeProject} from '../../assets/catalog.js';
import {MAX_PLAN_BYTES,quoteInput,validatePlans,LeadValidationError} from './lead-files.mjs';
import {serviceIds,text,validPhone,projectInput,settingsInput,cleanEvent,eventInput,summarize} from './core.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>json({error:message},status);
export function makeHandler({getStore,authorize}){return async function handler(req){
 const url=new URL(req.url),action=url.searchParams.get('action')||'public';
 try{
  if(req.method==='OPTIONS')return new Response(null,{status:405});
  if(!['GET','POST'].includes(req.method))return fail('Метод не підтримується.',405);
  if(req.method==='POST'&&req.headers.get('origin')!==url.origin)return fail('Запит дозволено лише з цього сайту.',403);
  const length=Number(req.headers.get('content-length')||0);if(length>(action==='lead'?MAX_PLAN_BYTES+80000:3200000))return fail('Запит завеликий.',413);
  const store=getStore({name:'omegabud-content',consistency:'strong'});
  if(action==='media'&&req.method==='GET'){
   const id=url.searchParams.get('id')||'';if(!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(id))return fail('Невірне фото.',404);
   const item=await store.getWithMetadata('media/'+id,{type:'arrayBuffer'});if(!item)return fail('Фото не знайдено.',404);
   return new Response(item.data,{headers:{'Content-Type':item.metadata.type,'Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});
  }
  if(action==='public'&&req.method==='GET'){
   const {blobs}=await store.list({prefix:'projects/'});const projects=(await Promise.all(blobs.map(x=>store.get(x.key,{type:'json'})))).filter(x=>x&&x.published).map(normalizeProject).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
   const settings=await store.get('settings',{type:'json'})||{};return json({projects,settings});
  }
  if(action==='event'&&req.method==='POST'){
   const raw=await req.text();if(raw.length>2000)return fail('Запит завеликий.',413);const event=cleanEvent(JSON.parse(raw));if(!event.session)return fail('Немає сеансу.');
   const events=getStore('omegabud-events');await events.setJSON(`events/${event.at.slice(0,10)}/${randomUUID()}`,event);return json({ok:true});
  }
  if(action==='lead'&&req.method==='POST'){
   let d,files=[];
   if((req.headers.get('content-type')||'').startsWith('multipart/form-data')){
    const payload=await req.formData(),raw=payload.get('data');if(typeof raw!=='string'||raw.length>16000)return fail('Некоректні дані заявки.');d=JSON.parse(raw);files=payload.getAll('plans');
   }else{const raw=await req.text();if(raw.length>16000)return fail('Запит завеликий.',413);d=JSON.parse(raw);}
   if(d.website)return fail('Не вдалося надіслати заявку.');
   const name=text(d.name,100),phone=text(d.phone,24),service=text(d.service,60);
   if(!name||!validPhone(phone)||!serviceIds.includes(service)||d.privacy!==true)return fail('Перевірте ім’я, телефон, послугу та згоду на обробку даних.');
   const quote=quoteInput(d),plans=await validatePlans(files);
   const id=/^[a-f0-9-]{36}$/.test(d.requestId||'')?d.requestId:randomUUID(),createdAt=new Date().toISOString(),leads=getStore({name:'omegabud-leads',consistency:'strong'});
   const key='leads/'+createdAt.slice(0,10)+'/'+id;
   if(await leads.get(key,{type:'json'}))return json({ok:true,id});
   const attachments=[];
   try{
    for(const plan of plans){const fileId=randomUUID(),fileKey='attachments/'+id+'/'+fileId+'.'+plan.extension;await leads.set(fileKey,plan.bytes,{metadata:{type:plan.type,name:plan.name}});attachments.push({id:fileId,key:fileKey,name:plan.name,type:plan.type,size:plan.size});}
    const written=await leads.setJSON(key,{id,name,phone,service,...quote,details:text(d.details,3000),attachments,createdAt,status:'new'},{onlyIfNew:true});
    if(written?.modified===false){await Promise.all(attachments.map(file=>leads.delete(file.key)));return json({ok:true,id});}
   }catch(error){await Promise.allSettled(attachments.map(file=>leads.delete(file.key)));throw error;}
   if(d.analytics===true&&/^[a-f0-9-]{36}$/.test(d.session||'')){
    try{const e=eventInput({...d,type:'lead_submit'});await getStore('omegabud-events').setJSON(`events/${e.at.slice(0,10)}/${id}`,e);}catch{/* Keep a saved request successful if analytics is unavailable. */}
   }
   return json({ok:true,id});
  }
  const token=req.headers.get('authorization')||'';
  if(!await authorize(token))return fail('Увійдіть як власник сайту.',401);
  if(action==='lead-file'&&req.method==='GET'){
   const id=url.searchParams.get('lead')||'',date=url.searchParams.get('date')||'',fileId=url.searchParams.get('file')||'';
   if(!/^[a-f0-9-]{36}$/.test(id)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^[a-f0-9-]{36}$/.test(fileId))return fail('Файл не знайдено.',404);
   const leads=getStore({name:'omegabud-leads',consistency:'strong'}),lead=await leads.get('leads/'+date+'/'+id,{type:'json'});
   const file=lead?.attachments?.find(f=>f.id===fileId);if(!file)return fail('Файл не знайдено.',404);
   const item=await leads.getWithMetadata(file.key,{type:'arrayBuffer'});if(!item)return fail('Файл не знайдено.',404);
   return new Response(item.data,{headers:{'Content-Type':file.type,'Content-Disposition':"attachment; filename=plan."+file.key.split('.').pop()+"; filename*=UTF-8''"+encodeURIComponent(file.name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase()),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'"}});
  }
  if(action==='dashboard'&&req.method==='GET'){
   const {blobs}=await store.list({prefix:'projects/'});return json({projects:(await Promise.all(blobs.map(x=>store.get(x.key,{type:'json'})))).filter(Boolean).map(normalizeProject),settings:await store.get('settings',{type:'json'})||{}});
  }
  if(action==='project'&&req.method==='POST'){
   const raw=await req.text();if(raw.length>12000)return fail('Запит завеликий.',413);const d=JSON.parse(raw);const id=/^[a-f0-9-]{36}$/.test(d.id||'')?d.id:randomUUID();const previous=await store.get('projects/'+id,{type:'json'});const project={...projectInput({...previous,...d}),id};await store.setJSON('projects/'+id,project);return json({project});
  }
  if(action==='settings'&&req.method==='POST'){
   const raw=await req.text();if(raw.length>5000)return fail('Запит завеликий.',413);const settings=settingsInput(JSON.parse(raw));await store.setJSON('settings',settings);return json({settings});
  }
  if(action==='upload'&&req.method==='POST'){
   const type=req.headers.get('content-type')||'';const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type];if(!ext)return fail('Дозволені JPEG, PNG і WebP.');
   const bytes=await req.arrayBuffer();if(bytes.byteLength>2200000||bytes.byteLength<12)return fail('Розмір фото має бути до 2 МБ.',413);
   const v=new Uint8Array(bytes);const valid=ext==='jpg'?v[0]===255&&v[1]===216&&v[2]===255:ext==='png'?v[0]===137&&v[1]===80&&v[2]===78&&v[3]===71:String.fromCharCode(...v.slice(0,4))==='RIFF'&&String.fromCharCode(...v.slice(8,12))==='WEBP';if(!valid)return fail('Формат фото не відповідає файлу.');
   const id=randomUUID()+'.'+ext;await store.set('media/'+id,bytes,{metadata:{type}});return json({url:'/.netlify/functions/site-api?action=media&id='+id});
  }
  if(action==='leads'&&req.method==='GET'){
   const leadStore=getStore({name:'omegabud-leads',consistency:'strong'}),{blobs}=await leadStore.list({prefix:'leads/'});const items=blobs.sort((a,b)=>b.key.localeCompare(a.key)).slice(0,1000);return json({leads:(await Promise.all(items.map(x=>leadStore.get(x.key,{type:'json'})))).filter(Boolean).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),limited:blobs.length>1000});
  }
  if(action==='lead-delete'&&req.method==='POST'){
   const d=await req.json();if(!/^leads\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]{36}$/.test(d.key||''))return fail('Невірна заявка.');const leads=getStore({name:'omegabud-leads',consistency:'strong'}),lead=await leads.get(d.key,{type:'json'});for(const file of lead?.attachments||[])await leads.delete(file.key);await leads.delete(d.key);return json({ok:true});
  }
  if(action==='lead-status'&&req.method==='POST'){
   const d=await req.json();if(!/^leads\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]{36}$/.test(d.key||'')||!['new','contacted','done'].includes(d.status))return fail('Невірна заявка.');
   const leadStore=getStore({name:'omegabud-leads',consistency:'strong'}),lead=await leadStore.get(d.key,{type:'json'});if(!lead)return fail('Заявку не знайдено.',404);lead.status=d.status;await leadStore.setJSON(d.key,lead);return json({ok:true});
  }
  if(action==='analytics'&&req.method==='GET'){
   const days=Math.max(1,Math.min(90,Number(url.searchParams.get('days'))||30));const events=getStore('omegabud-events');const gathered=[];let limited=false;
   for(let i=0;i<days;i++){
    const date=new Date();date.setUTCDate(date.getUTCDate()-i);const {blobs}=await events.list({prefix:`events/${date.toISOString().slice(0,10)}/`});
    if(gathered.length+blobs.length>20000){limited=true;break;}
    const values=await Promise.all(blobs.map(x=>events.get(x.key,{type:'json'})));gathered.push(...values.filter(Boolean));
   }
   return json({summary:summarize(gathered),days,limited});
  }
  return fail('Дію не знайдено.',404);
 }catch(error){console.error('Site API error:',error.name);if(error instanceof LeadValidationError)return fail(error.message);if(error instanceof SyntaxError)return fail('Некоректний запит.');if(error.message.startsWith('Вкажіть')||error.message.startsWith('Для публікації')||error.message==='Недопустима подія.')return fail(error.message);return fail('Сервіс тимчасово недоступний. Спробуйте ще раз або зателефонуйте.',503);}
};}
