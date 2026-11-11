import {getStore} from '@netlify/blobs';
export default async()=>{const store=getStore('omegabud-events');const cutoff=new Date(Date.now()-90*86400000).toISOString().slice(0,10);for await(const page of store.list({prefix:'events/',paginate:true})){for(const blob of page.blobs){if(blob.key.split('/')[1]<cutoff)await store.delete(blob.key);}}return new Response(null,{status:204});};
export const config={schedule:'30 2 * * *'};
