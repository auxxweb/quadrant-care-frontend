const apiOrigin = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export const API_ORIGIN = apiOrigin;
export const API_BASE_URL = `${apiOrigin}/api`;
export const UPLOADS_BASE_URL = `${apiOrigin}/uploads`;
export const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';

export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
