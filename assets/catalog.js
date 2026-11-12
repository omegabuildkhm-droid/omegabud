// Shared classification for the website, admin panel and API.
export const objectTypeLabels={apartment:'Квартира',house:'Приватний будинок',office:'Офіс',commercial:'Комерційне приміщення',other:'Інший об’єкт',unspecified:'Тип не вказаний'};
export const workTypeLabels={'napivsukha-stiazhka':'Напівсуха стяжка','natiazhni-steli':'Натяжні стелі','mashynna-shtukaturka':'Машинна штукатурка','maliarni-roboty':'Малярні роботи','plytkovi-roboty':'Плиткові роботи','hipsokartonni-roboty':'Гіпсокартонні роботи','demontazhni-roboty':'Демонтажні роботи'};
export const serviceNames={'remont-kvartyr':'Ремонт квартир','remont-ofisiv':'Ремонт офісів і комерційних приміщень',...workTypeLabels};
export const serviceIds=[...Object.keys(serviceNames),'consultation'];
export function normalizeProject(project){
 const explicitObject=Object.hasOwn(objectTypeLabels,project.objectType);
 const objectType=explicitObject?project.objectType:project.service==='remont-kvartyr'?'apartment':project.service==='remont-ofisiv'?'commercial':'unspecified';
 const workTypes=Array.isArray(project.workTypes)?[...new Set(project.workTypes.filter(id=>Object.hasOwn(workTypeLabels,id)))]:Object.hasOwn(workTypeLabels,project.service)?[project.service]:[];
 return {...project,objectType,workTypes};
}
export function matchesService(project,id){const p=normalizeProject(project);if(id==='remont-kvartyr')return p.objectType==='apartment';if(id==='remont-ofisiv')return ['office','commercial'].includes(p.objectType);return p.workTypes.includes(id);}
export function matchesProjectFilters(project,objectType='all',workType='all'){const p=normalizeProject(project);return (objectType==='all'||p.objectType===objectType)&&(workType==='all'||p.workTypes.includes(workType));}
