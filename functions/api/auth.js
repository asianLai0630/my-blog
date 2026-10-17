import { authorize } from '../../cms/oauth.js';
export const onRequestGet = ({ request, env }) => authorize(request, env);
