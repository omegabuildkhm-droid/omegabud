import {readWorkCatalog,publicServices} from './work-catalog.mjs';
import {renderHome,renderQuote,renderService,renderPrivacy,renderSitemap,renderNotFound} from '../../scripts/site-templates.mjs';

export function makePagesHandler(getStore) {
  return async function pages(request) {
    try {
      const store = getStore({name:'omegabud-content',consistency:'strong'});
      const services = publicServices(await readWorkCatalog(store));
      const path = new URL(request.url).pathname.replace(/\/index\.html$/,'').replace(/\/$/,'');
      const headers = {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'};
      if (path === '') return new Response(renderHome(services),{headers});
      if (path === '/koshtorys') return new Response(renderQuote(services),{headers});
      if (path === '/privacy') return new Response(renderPrivacy(services),{headers});
      if (path === '/sitemap.xml') {
        headers['Content-Type'] = 'application/xml; charset=utf-8';
        return new Response(renderSitemap(services),{headers});
      }
      const service = services.find(item => path === '/posluhy/' + item.id);
      if (service) return new Response(renderService(service,services),{headers});
      return new Response(renderNotFound(services),{status:404,headers});
    } catch (error) {
      console.error('Catalog page error:',error.name);
      return new Response('Сторінка тимчасово недоступна. Спробуйте ще раз.',{
        status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}
      });
    }
  };
}
