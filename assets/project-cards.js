import {objectTypeLabels,workTypeLabels} from './catalog.js';
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugs={
 '5d79491a-d258-4129-bc94-b6426d34beff':'remont-ofisu',
 '8d343d2c-d7e6-43fa-a0ea-5b0f19b8219b':'dendroparkovyi-ozdoblennia',
 '6c59e9eb-23fb-4b84-9b17-9ed5a93b6687':'dendroparkovyi-muruvannia',
 '55cee339-6498-4cbc-8b67-ff8430c34860':'pryvatbank',
 'f7b210c6-3815-48c6-83ff-8c114930ec44':'salon-krasy'
};
export const projectPath=p=>'/obiekty/'+(slugs[p.id]||encodeURIComponent(p.id))+'/';
export const safePhoto=url=>/^\/\.netlify\/functions\/site-api\?action=media&id=[a-f0-9-]{36}\.(jpg|png|webp)$/.test(url||'');
export function projectExcerpt(project){
 const text=String(project.summary||project.description||'').replace(/\s+/g,' ').trim();
 const sentences=text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[];
 const short=sentences.slice(0,2).join(' ').replace(/\s+/g,' ').trim();
 return short.length<=240?short:short.slice(0,237).replace(/\s+\S*$/,'')+'…';
}
export function renderProjectCards(projects,labels=workTypeLabels){return projects.map(p=>{
 const e=escapeHtml,path=projectPath(p),works=(p.workTypes||[]).filter(id=>labels[id]),tags=works.slice(0,3);
 return `<article class="project-card"><a class="project-cover-link" href="${path}" aria-label="${e('Детальніше: '+p.title)}"><img class="project-cover" src="${e(p.photos[0])}" alt="${e(p.title)}" width="960" height="720" loading="lazy"></a><div class="project-body"><span>${e(objectTypeLabels[p.objectType]||'Об’єкт')}</span><h3><a href="${path}">${e(p.title)}</a></h3><div class="project-work-tags">${tags.map(id=>`<span>${e(labels[id])}</span>`).join('')}${works.length>3?`<span>Ще ${works.length-3}</span>`:''}</div>${p.area||p.duration?`<div class="project-meta">${p.area?`<span>${e(p.area)}</span>`:''}${p.duration?`<span>${e(p.duration)}</span>`:''}</div>`:''}<p class="project-excerpt">${e(projectExcerpt(p))}</p><a class="text-link project-details-link" href="${path}">Детальніше про об’єкт →</a></div></article>`;
 }).join('');}
