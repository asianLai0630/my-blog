import { callback } from '../../cms/oauth.js';
export const onRequestGet = ({ request, env }) => callback(request, env);
