// Shared classification for the website, admin panel and API.
export const objectTypeLabels={apartment:'Квартира',house:'Приватний будинок',office:'Офіс',retail:'Магазин / відділення банку',beauty:'Салон краси / студія',commercial:'Комерційне приміщення',other:'Інший об’єкт',unspecified:'Тип не вказаний'};
export const workTypeLabels={'napivsukha-stiazhka':'Напівсуха стяжка','natiazhni-steli':'Натяжні стелі','mashynna-shtukaturka':'Машинна штукатурка','maliarni-roboty':'Малярні роботи','plytkovi-roboty':'Плиткові роботи','hipsokartonni-roboty':'Гіпсокартонні роботи','demontazhni-roboty':'Демонтажні роботи','elektromontazhni-roboty':'Електромонтажні роботи','muruvalni-roboty':'Мурувальні роботи'};
export const objectServiceTypes={'remont-kvartyr':['apartment'],'remont-budynkiv':['house'],'remont-ofisiv':['office','commercial'],'remont-mahazyniv-bankiv':['retail'],'remont-saloniv-krasy':['beauty'],'remont-komertsiinykh-prymishchen':['commercial','other']};
export const serviceNames={'remont-kvartyr':'Ремонт квартир','remont-ofisiv':'Ремонт офісів','remont-budynkiv':'Приватні будинки та котеджі','remont-mahazyniv-bankiv':'Магазини та відділення банків','remont-saloniv-krasy':'Салони краси та студії','remont-komertsiinykh-prymishchen':'Інші комерційні об’єкти',...workTypeLabels};
export const serviceIds=[...Object.keys(serviceNames),'consultation'];
export function normalizeProject(project, labels=workTypeLabels){
 const explicitObject=Object.hasOwn(objectTypeLabels,project.objectType);
 const objectType=explicitObject?project.objectType:project.service==='remont-kvartyr'?'apartment':project.service==='remont-ofisiv'?'commercial':objectServiceTypes[project.service]?.[0]||'unspecified';
 const workTypes=Array.isArray(project.workTypes)?[...new Set(project.workTypes.filter(id=>Object.hasOwn(labels,id)))]:Object.hasOwn(labels,project.service)?[project.service]:[];
 const photoWorkTypes=Object.fromEntries((Array.isArray(project.photos)?project.photos:[]).filter(url=>Array.isArray(project.photoWorkTypes?.[url])).map(url=>[url,[...new Set(project.photoWorkTypes[url].filter(id=>Object.hasOwn(labels,id)))]]));
 return {...project,objectType,workTypes,photoWorkTypes};
}
// Missing per-photo tags retain legacy project classification; an explicit [] excludes a photo from work galleries.
export function photoWorkTypesFor(project,url,labels){const p=normalizeProject(project,labels);return Object.hasOwn(p.photoWorkTypes,url)?p.photoWorkTypes[url]:p.workTypes;}
export function photosForWork(project,workType='all'){const photos=Array.isArray(project.photos)?project.photos:[];return workType==='all'?photos:photos.filter(url=>photoWorkTypesFor(project,url).includes(workType));}
export function projectWorkTypes(project,labels){const p=normalizeProject(project,labels);return [...new Set(p.photos?.length?p.photos.flatMap(url=>photoWorkTypesFor(p,url,labels)):p.workTypes)];}
export function matchesService(project,id){const p=normalizeProject(project);if(id==='remont-mahazyniv-bankiv'&&p.objectType==='commercial')return /банк|приват|магазин|торгов/i.test(p.title||'');if(id==='remont-saloniv-krasy'&&p.objectType==='commercial')return /салон|студі|студи/i.test(p.title||'');if(Object.hasOwn(objectServiceTypes,id))return objectServiceTypes[id].includes(p.objectType);return projectWorkTypes(p).includes(id);}
export function matchesProjectFilters(project,objectType='all',workType='all'){const p=normalizeProject(project);return (objectType==='all'||p.objectType===objectType)&&(workType==='all'||projectWorkTypes(p).includes(workType));}

