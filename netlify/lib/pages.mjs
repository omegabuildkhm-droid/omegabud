import {readWorkCatalog,publicServices} from './work-catalog.mjs';
import {renderHome,renderQuote,renderService,renderPrivacy,renderSitemap,renderNotFound,renderProject} from '../../scripts/site-templates.mjs';

import {normalizeProject,matchesService,photosForWork,workTypeLabels} from '../../assets/catalog.js';
import {projectPath,safePhoto} from '../../assets/project-cards.js';
import {withPortfolioDescription} from '../../data/project-descriptions.mjs';
import {withPortfolioDetails} from '../../data/project-migrations.mjs';

export function makePagesHandler(getStore) {
  return async function pages(request) {
    try {
      const store = getStore({name:'omegabud-content',consistency:'strong'});
      const catalog=await readWorkCatalog(store);
      const services=publicServices(catalog);
      const {blobs}=await store.list({prefix:'projects/'});
      const labels=Object.fromEntries(catalog.map(item=>[item.id,item.short]));
      const projects=(await Promise.all(blobs.map(blob=>store.get(blob.key,{type:'json'}))))
        .filter(p=>p?.published&&p.photos?.length&&p.photos.every(safePhoto))
        .map(p=>normalizeProject(withPortfolioDetails(withPortfolioDescription(p)),labels))
        .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
      const path = new URL(request.url).pathname.replace(/\/index\.html$/,'').replace(/\/$/,'');
      const headers = {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'};
      if (path === '') {
        const settings=await store.get('settings',{type:'json'})||{};
        return new Response(renderHome(services,projects,settings),{headers});
      }
      if (path === '/koshtorys') return new Response(renderQuote(services),{headers});
      if (path === '/privacy') return new Response(renderPrivacy(services),{headers});
      if (path === '/sitemap.xml') {
        headers['Content-Type'] = 'application/xml; charset=utf-8';
        return new Response(renderSitemap(services,projects),{headers});
      }
      const service = services.find(item => path === '/posluhy/' + item.id);
      if (service) {
        const matchingProjects=projects.filter(p=>matchesService(p,service.id))
          .map(p=>({...p,photos:Object.hasOwn(workTypeLabels,service.id)?photosForWork(p,service.id):p.photos}))
          .filter(p=>p.photos.length);
        const showBankProject=service.id==='napivsukha-stiazhka'&&projects.some(p=>projectPath(p)==='/obiekty/pryvatbank/');
        return new Response(renderService(service,services,matchingProjects,showBankProject),{headers});
      }
      const project=projects.find(p=>path===projectPath(p).replace(/\/$/,''));
      if(project)return new Response(renderProject(project,services,labels),{headers});
      return new Response(renderNotFound(services),{status:404,headers});
    } catch (error) {
      console.error('Catalog page error:',error.name);
      return new Response('Сторінка тимчасово недоступна. Спробуйте ще раз.',{
        status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}
      });
    }
  };
}

