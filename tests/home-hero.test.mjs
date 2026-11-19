import test from 'node:test';
import assert from 'node:assert/strict';
import {makePagesHandler} from '../netlify/lib/pages.mjs';
const photo='/.netlify/functions/site-api?action=media&id=12345678-1234-1234-1234-123456789abc.jpg';
const chosen='/.netlify/functions/site-api?action=media&id=22345678-1234-1234-1234-123456789abc.webp';
const project={id:'public',title:'Опублікований офіс',published:true,photos:[photo],updatedAt:'2026-11-19T12:00:00Z',objectType:'office'};
async function home(items=[project],settings={}){
 const map=new Map(items.map(p=>['projects/'+p.id,p]));map.set('settings',settings);
 const handler=makePagesHandler(()=>({async list({prefix}){return {blobs:[...map.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))}},async get(key){return map.get(key)||null}}));
 const response=await handler(new Request('https://example.com/'));assert.equal(response.status,200);return response.text();
}
test('homepage serves the real hero and matching preload in the original HTML',async()=>{
 const html=await home();const escaped=photo.replace('&','&amp;');
 assert.ok(html.includes('id="hero-photo" src="'+escaped+'"'));
 assert.ok(html.includes('rel="preload" as="image" href="'+escaped+'" fetchpriority="high"'));
 assert.ok(html.includes('alt="Опублікований офіс" loading="eager"'));
 assert.ok(!html.includes('src="/assets/interior.svg"'));
 assert.ok(html.includes('id="hero-caption">ОБ’ЄКТ ОМЕГАБУД · ФОТО РОБІТ'));
});
test('owner-selected hero and text appear without waiting for client requests',async()=>{
 const html=await home([project],{hero:chosen,headline:'Власний <заголовок>',description:'Власний опис'});
 assert.ok(html.includes('id="hero-photo" src="'+chosen.replace('&','&amp;')+'"'));
 assert.ok(html.includes('id="hero-title">Власний &lt;заголовок&gt;</h1>'));
 assert.ok(html.includes('id="hero-description">Власний опис</p>'));
});
test('draft projects never supply the hero and an empty portfolio keeps a fallback',async()=>{
 const html=await home([{...project,id:'draft',published:false,updatedAt:'2027-01-01'}]);
 assert.ok(html.includes('id="hero-photo" src="/assets/interior.svg"'));
 assert.ok(!html.includes(photo.replace('&','&amp;')));
 assert.ok(!html.includes('rel="preload" as="image"'));
});
test('invalid configured hero safely falls back to the published project',async()=>{
 const html=await home([project],{hero:'javascript:alert(1)'});
 assert.ok(html.includes('id="hero-photo" src="'+photo.replace('&','&amp;')+'"'));
 assert.ok(!html.includes('javascript:alert(1)'));
});
