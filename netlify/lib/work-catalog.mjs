import {services} from '../../data/services.mjs';

const defaults = new Map(services.filter(service => service.group === 'work').map(service => [service.id, service]));
export const customWorkId = /^work-[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function readWorkCatalog(store) {
  const {blobs} = await store.list({prefix:'work-catalog/'});
  const saved = await Promise.all(blobs.map(({key}) => store.get(key,{type:'json'})));
  const overrides = new Map(saved.filter(Boolean).map(item => [item.id,item]));
  return [
    ...[...defaults.values()].map(service => ({...service,published:overrides.get(service.id)?.published !== false})),
    ...saved.filter(item => item && customWorkId.test(item.id)).sort((a,b) => a.name.localeCompare(b.name,'uk'))
  ];
}

export function publicServices(catalog) {
  return [...services.filter(service => service.group === 'object'), ...catalog.filter(service => service.published)];
}

export async function saveWork(store, data) {
  const {id, published} = data;
  if (typeof id !== 'string' || id.length > 60 ||
      (!defaults.has(id) && !customWorkId.test(id)) || typeof published !== 'boolean') {
    throw new Error('Вкажіть коректну адресу та стан публікації.');
  }
  const key = 'work-catalog/' + id;
  if (defaults.has(id)) {
    await store.setJSON(key,{id,published});
    return;
  }
  const existing = await store.get(key,{type:'json'});
  if (data.create ? existing : !existing) throw new Error('Вкажіть вільну адресу для нової послуги або оновіть список.');
  if (data.statusOnly === true && existing && !data.create) {
    await store.setJSON(key,{...existing,published});
    return;
  }
  const field = (key, max) => {
    const value = data[key];
    if (typeof value !== 'string' || value.length > max) throw new Error('Вкажіть коректну довжину тексту.');
    return value.trim();
  };
  const name = field('name',100), lead = field('lead',1200);
  const includes = field('includes',2400).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!name || !lead || includes.length > 12) throw new Error('Вкажіть назву, опис і до 12 пунктів робіт.');
  const service = {
    id,name,short:name,lead,includes,published,group:'work',tag:'',
    title:name,category:'Будівельні та ремонтні роботи',
    price:field('price',600) || 'Вартість визначаємо після уточнення обсягу робіт.',
    prepare:'Опишіть об’єкт і потрібні роботи. За наявності додайте фото або план.',
    questions:[]
  };
  const result = await store.setJSON(key,service,data.create?{onlyIfNew:true}:undefined);
  if (result?.modified === false) throw new Error('Вкажіть іншу адресу: ця вже зайнята.');
}
