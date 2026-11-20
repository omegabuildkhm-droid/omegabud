import {mkdir,rm,writeFile,cp} from 'node:fs/promises';
import {services} from '../data/services.mjs';
import {base,renderHome,renderService,renderQuote,renderPrivacy,renderNotFound,renderSitemap} from './site-templates.mjs';

await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await writeFile('dist/index.html',renderHome(services));
for(const service of services){
 const directory='dist/posluhy/'+service.id;
 await mkdir(directory,{recursive:true});
 await writeFile(directory+'/index.html',renderService(service,services));
}
await mkdir('dist/koshtorys',{recursive:true});
await writeFile('dist/koshtorys/index.html',renderQuote(services));
await mkdir('dist/privacy',{recursive:true});
await writeFile('dist/privacy/index.html',renderPrivacy(services));
await writeFile('dist/404.html',renderNotFound(services));
await cp('dist/index.html','index.html');
await cp('googledd35b3ce990ac531.html','dist/googledd35b3ce990ac531.html');
await cp('styles.css','dist/styles.css');await cp('script.js','dist/script.js');await cp('assets','dist/assets',{recursive:true});await cp('admin','dist/admin',{recursive:true});
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${base}/sitemap.xml\n`);
await writeFile('dist/sitemap.xml',renderSitemap(services));
console.log('Built homepage, '+services.length+' service pages, estimate request, privacy, admin and sitemap.');
