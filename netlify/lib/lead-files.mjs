import {text} from './core.mjs';
export const MAX_PLAN_FILES=3;
export const MAX_PLAN_BYTES=4*1024*1024;
export const AREA_BASES=['premises','walls','ceiling','surfaces','unknown'];
export const PROPERTY_TYPES=['new_build','secondary','house','office','commercial','other'];
export class LeadValidationError extends Error{}
export function quoteInput(data){
 const modern=data.formVersion===2;
 const workDescription=text(data.workDescription,3000),city=text(data.city,100),district=text(data.district,120);
 const unknown=data.areaUnknown===true,raw=text(String(data.area??''),12).replace(',','.');
 const area=unknown?null:raw&&/^\d{1,6}(?:\.\d{1,2})?$/.test(raw)?Number(raw):null;
 if(modern&&workDescription.length<5)throw new LeadValidationError('Опишіть потрібні роботи (щонайменше 5 символів).');
 if(modern&&(!city||!district))throw new LeadValidationError('Вкажіть місто та район або населений пункт.');
 if(modern&&!unknown&&(!area||area>100000))throw new LeadValidationError('Вкажіть площу від 0,01 до 100 000 м² або позначте «Ще не знаю площу».');
 return {workDescription,city,district,area,areaUnknown:unknown,areaBasis:AREA_BASES.includes(data.areaBasis)?data.areaBasis:'unknown',propertyType:PROPERTY_TYPES.includes(data.propertyType)?data.propertyType:''};
}
export async function validatePlans(files){
 if(files.length>MAX_PLAN_FILES)throw new LeadValidationError('До заявки можна прикріпити до 3 файлів.');
 let total=0;const plans=[];
 for(const file of files){
  if(!file||typeof file.arrayBuffer!=='function'||!file.name||!file.size)throw new LeadValidationError('Один із файлів порожній або не читається.');
  total+=file.size;if(total>MAX_PLAN_BYTES)throw new LeadValidationError('Загальний розмір файлів має бути до 4 МБ.');
  const ext=file.name.split('.').pop().toLowerCase();const type={pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[ext];
  if(!type)throw new LeadValidationError('Підтримуються плани у PDF та зображення JPG, PNG або WebP.');
  const bytes=await file.arrayBuffer(),v=new Uint8Array(bytes);const ascii=(start,end)=>String.fromCharCode(...v.slice(start,end));
  const valid=ext==='pdf'?ascii(0,5)==='%PDF-':type==='image/jpeg'?v[0]===255&&v[1]===216&&v[2]===255:ext==='png'?v[0]===137&&ascii(1,4)==='PNG'&&v[4]===13&&v[5]===10&&v[6]===26&&v[7]===10:ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';
  if(!valid)throw new LeadValidationError('Вміст файлу не відповідає формату. Збережіть план у PDF або надішліть фото.');
  const name=file.name.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069/\\"]/g,'_').slice(0,150);
  plans.push({name,type,bytes,size:bytes.byteLength,extension:ext==='jpeg'?'jpg':ext});
 }
 return plans;
}
