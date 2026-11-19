import {getStore} from '@netlify/blobs';
import {makePagesHandler} from '../lib/pages.mjs';

export default makePagesHandler(getStore);
export const config = {
  path:['/','/index.html','/koshtorys','/koshtorys/','/privacy','/privacy/','/koshtorys/index.html','/privacy/index.html','/sitemap.xml','/posluhy/*']
};
