import test from 'node:test';
import assert from 'node:assert/strict';
import {renderProject,renderHome,renderService} from '../scripts/site-templates.mjs';
import {projectStory} from '../data/project-stories.mjs';
import {withPortfolioDescription} from '../data/project-descriptions.mjs';
import {services} from '../data/services.mjs';
const photo='/.netlify/functions/site-api?action=media&id=12345678-1234-1234-1234-123456789abc.jpg';
const bank=withPortfolioDescription({id:'55cee339-6498-4cbc-8b67-ff8430c34860',title:'ПриватБанк',updatedAt:'2026-11-16T14:36:28.725Z',objectType:'retail',service:'remont-mahazyniv-bankiv',photos:[photo],workTypes:['plytkovi-roboty']});
const labels=Object.fromEntries(services.map(s=>[s.id,s.short]));
test('reviewed stories render semantic sections and valid project schema directly in HTML',()=>{
 const html=renderProject(bank,services,labels);
 assert.ok(projectStory(bank));
 for(const heading of ['Завдання','Виконані роботи','Особливі рішення','Результат'])assert.ok(html.includes('<h2>'+heading+'</h2>'));
 assert.ok(html.includes('Провели демонтажні роботи'));
 assert.ok(html.includes('/posluhy/remont-mahazyniv-bankiv/'));
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const graph=schemas.find(s=>s['@graph'])['@graph'];
 const article=graph.find(s=>s['@type']==='Article');assert.ok(article.articleBody.includes('Провели демонтажні роботи'));
 assert.equal(graph.find(s=>s['@type']==='BreadcrumbList').itemListElement.length,3);
});
test('owner changes and intentional clearing override reviewed case studies',()=>{
 for(const changes of [{description:'Новий опис <script>не HTML</script>'},{description:''},{updatedAt:'2026-11-20T00:00:00Z'}]){
 const project={...bank,...changes};assert.equal(projectStory(project),null);
 const html=renderProject(project,services,labels);assert.ok(!html.includes('Провели демонтажні роботи'));assert.ok(!html.includes('<script>не HTML</script>'));
 }
});
test('working terms are present once on the homepage and every service page',()=>{
 for(const html of [renderHome(services),...services.map(s=>renderService(s,services))]){
 assert.equal((html.match(/id="working-terms"/g)||[]).length,1);
 assert.ok(html.includes('Додаткові роботи виконуємо тільки після вашого погодження'));
 assert.ok(html.includes('закупівельнику Омегабуд'));
 }
});
