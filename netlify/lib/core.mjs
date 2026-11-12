import {serviceIds,objectTypeLabels,workTypeLabels,normalizeProject} from '../../assets/catalog.js';
export {serviceIds};
export const eventTypes=['page_view','service_impression','service_click','phone_click','email_click','cta_click','lead_submit'];
export const text=(value,max=300)=>typeof value==='string'?value.trim().slice(0,max):'';
export function validPhone(value){const digits=value.replace(/\D/g,'');return /^0\d{9}$/.test(digits)||/^380\d{9}$/.test(digits)||(/^\+[\d ()-]+$/.test(value)&&/^[1-9]\d{7,14}$/.test(digits));}
export function validMedia(value){return /^\/\.netlify\/functions\/site-api\?action=media&id=[a-f0-9-]{36}\.(jpg|png|webp)$/.test(value);}
export function projectInput(data){
 const title=text(data.title,120),classified=normalizeProject(data),photos=Array.isArray(data.photos)?data.photos.filter(validMedia).slice(0,12):[];
 if(!title||classified.objectType==='unspecified'&&!classified.workTypes.length)throw new Error('Вкажіть назву, тип об’єкта або виконані роботи.');
 if(data.objectType&&!Object.hasOwn(objectTypeLabels,data.objectType))throw new Error('Вкажіть коректний тип об’єкта.');
 if(Array.isArray(data.workTypes)&&data.workTypes.some(id=>!Object.hasOwn(workTypeLabels,id)))throw new Error('Вкажіть коректні види робіт.');
 if(data.published&&!photos.length)throw new Error('Для публікації додайте хоча б одне фото.');
 const service=classified.objectType==='apartment'?'remont-kvartyr':['office','commercial'].includes(classified.objectType)?'remont-ofisiv':classified.workTypes[0]||'';
 return {title,service,objectType:classified.objectType,workTypes:classified.workTypes,photos,area:text(data.area,60),duration:text(data.duration,80),description:text(data.description,3000),published:data.published===true,updatedAt:new Date().toISOString()};
}

export function settingsInput(data){return {headline:text(data.headline,160),description:text(data.description,500),hero:validMedia(data.hero)?data.hero:'',gaId:/^G-[A-Z0-9]{5,20}$/.test(data.gaId||'')?data.gaId:'',searchVerification:/^[A-Za-z0-9_-]{10,100}$/.test(data.searchVerification||'')?data.searchVerification:''};}
export function cleanEvent(data){
 if(!eventTypes.includes(data.type)||data.type==='lead_submit')throw new Error('Недопустима подія.');
 return eventInput(data);
}
export function eventInput(data){
 const path=text(data.path,180).split(/[?#]/)[0];
 return {type:data.type,path:/^\/(?:[a-z0-9/_-]*)$/.test(path)?path:'/',session:/^[a-f0-9-]{36}$/.test(data.session||'')?data.session:'',service:serviceIds.includes(data.service)?data.service:'',source:text(data.source,100).replace(/[^a-zA-Z0-9._-]/g,''),campaign:text(data.campaign,100).replace(/[^a-zA-Z0-9._-]/g,''),at:new Date().toISOString()};
}
export function summarize(events){
 const views=events.filter(e=>e.type==='page_view'),sessions=new Set(views.map(e=>e.session).filter(Boolean));
 const converted=new Set(events.filter(e=>e.type==='lead_submit'&&sessions.has(e.session)).map(e=>e.session));
 const summary={pageViews:views.length,sessions:sessions.size,leads:events.filter(e=>e.type==='lead_submit').length,conversions:converted.size,conversionRate:sessions.size?Math.round(converted.size/sessions.size*10000)/100:0,phoneClicks:events.filter(e=>e.type==='phone_click').length,emailClicks:events.filter(e=>e.type==='email_click').length,impressions:events.filter(e=>e.type==='service_impression').length,serviceClicks:events.filter(e=>e.type==='service_click').length,pages:{},sources:{},services:{},days:{}};
 for(const e of events){const day=e.at.slice(0,10);summary.days[day]??={views:0,leads:0};if(e.type==='page_view'){summary.pages[e.path]=(summary.pages[e.path]||0)+1;summary.sources[e.source||'Прямі переходи']=(summary.sources[e.source||'Прямі переходи']||0)+1;summary.days[day].views++;}if(e.type==='lead_submit')summary.days[day].leads++;if(e.service){const s=summary.services[e.service]??={impressions:0,clicks:0,leads:0};if(e.type==='service_impression')s.impressions++;if(e.type==='service_click')s.clicks++;if(e.type==='lead_submit')s.leads++;}}
 return summary;
}
