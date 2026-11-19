import test from 'node:test';
import assert from 'node:assert/strict';
import {makePagesHandler} from '../netlify/lib/pages.mjs';
import {withPortfolioDetails} from '../data/project-migrations.mjs';
import {renderProjectCards,projectPath} from '../assets/project-cards.js';
import {serviceSeo} from '../data/seo.mjs';
const photo='/.netlify/functions/site-api?action=media&id=12345678-1234-1234-1234-123456789abc.jpg';
const office={id:'5d79491a-d258-4129-bc94-b6426d34beff',title:'Ремонт офісу',objectType:'commercial',service:'remont-ofisiv',updatedAt:'2026-11-19T11:32:14.303Z',published:true,photos:[photo],description:'Виконали комплексний ремонт офісу. Оздобили робочі зони.\n\nПовний опис із деталями.'};
function setup(items){const entries=new Map(items.map(p=>['projects/'+p.id,p]));const getStore=()=>({async list({prefix}){return {blobs:[...entries.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))}},async get(key){return entries.get(key)||null}});const handler=makePagesHandler(getStore);return path=>handler(new Request('https://example.com'+path));}
test('reviewed categories apply to original revisions and preserve subsequent owner edits',()=>{
 assert.equal(withPortfolioDetails(office).objectType,'office');
 const edited={...office,updatedAt:'2026-11-20T10:00:00Z',objectType:'other',title:'Зміна власника'};
 assert.deepEqual(withPortfolioDetails(edited),edited);
 assert.equal(withPortfolioDetails(null),null);
 assert.equal(withPortfolioDetails({id:'55cee339-6498-4cbc-8b67-ff8430c34860',updatedAt:'2026-11-16T14:36:28.725Z'}).objectType,'retail');
 assert.equal(withPortfolioDetails({id:'f7b210c6-3815-48c6-83ff-8c114930ec44',updatedAt:'2026-11-12T15:12:37.631Z'}).objectType,'beauty');
});
test('compact cards link full pages and safely render only the teaser',()=>{
 const html=renderProjectCards([withPortfolioDetails(office)]);
 assert.ok(html.includes(projectPath(office)));
 assert.ok(html.includes('Детальніше про об’єкт'));
 assert.ok(!html.includes('Повний опис із деталями'));
 assert.ok(!html.includes('data-photo-index'));
 assert.ok(!renderProjectCards([{...office,title:'<script>bad</script>'}]).includes('<script>bad'));
});
test('published project pages and sitemap contain full content while drafts remain private',async()=>{
 const draft={...office,id:'draft',published:false,title:'Private draft'};
 const page=setup([office,draft]);
 const home=await (await page('/')).text();
 assert.ok(home.includes('/obiekty/remont-ofisu/'));
 assert.ok(!home.includes('Private draft'));
 const response=await page(projectPath(office));assert.equal(response.status,200);
 const html=await response.text();
 assert.ok(html.includes('Повний опис із деталями'));
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 assert.ok(html.includes('rel="canonical" href="https://omegabud.km.ua/obiekty/remont-ofisu/"'));
 assert.ok(html.includes('og:image'));
 assert.ok(html.includes('data-photo-index="0"'));
 assert.equal((await page(projectPath(draft))).status,404);
 const sitemap=await (await page('/sitemap.xml')).text();assert.ok(sitemap.includes(projectPath(office)));assert.ok(!sitemap.includes('/draft/'));
});
test('office portfolio excludes bank and salon after reviewed corrections',async()=>{
 const bank={...office,id:'55cee339-6498-4cbc-8b67-ff8430c34860',title:'ПриватБанк',updatedAt:'2026-11-16T14:36:28.725Z'};
 const salon={...office,id:'f7b210c6-3815-48c6-83ff-8c114930ec44',title:'Салон краси',updatedAt:'2026-11-12T15:12:37.631Z'};
 const page=setup([office,bank,salon]);
 const html=await (await page('/posluhy/remont-ofisiv/')).text();
 assert.ok(html.includes('/obiekty/remont-ofisu/'));assert.ok(!html.includes('/obiekty/pryvatbank/'));assert.ok(!html.includes('/obiekty/salon-krasy/'));
});
test('new object landing pages have explicit repair titles, headings and complete descriptions',()=>{
 for(const id of ['remont-budynkiv','remont-mahazyniv-bankiv','remont-saloniv-krasy','remont-komertsiinykh-prymishchen','remont-ofisiv']){
 const seo=serviceSeo[id];assert.match(seo.title,/Ремонт/);assert.match(seo.h1,/Ремонт/);assert.match(seo.description,/[.!?]$/);assert.ok(seo.description.length<180);
 }
 assert.ok(!serviceSeo['remont-ofisiv'].description.includes('магазин'));
});
