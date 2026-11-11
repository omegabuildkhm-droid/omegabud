import {getStore} from '@netlify/blobs';
import {makeHandler} from '../lib/handler.mjs';
const supabaseUrl='https://ioyxmqhbpzcibzjdjtoz.supabase.co';
const publishableKey='sb_publishable_-EY9FRTqKSFUej8-pndpFQ_4_o054Zn';
async function authorize(token){
 if(!/^Bearer [A-Za-z0-9_.-]+$/.test(token))return false;
 try{const userResponse=await fetch(supabaseUrl+'/auth/v1/user',{headers:{apikey:publishableKey,Authorization:token},signal:AbortSignal.timeout(8000)});if(!userResponse.ok||!(await userResponse.json()).id)return false;const response=await fetch(supabaseUrl+'/rest/v1/rpc/is_site_owner',{method:'POST',headers:{apikey:publishableKey,Authorization:token,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});return response.ok&&await response.json()===true;}catch{return false;}
}
export default makeHandler({getStore,authorize});
export const config={rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:120}};
