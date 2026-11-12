import type { APIRoute } from 'astro';
import { cerrarSesion } from '../../../lib/auth';

export const POST: APIRoute = ({ cookies, redirect, url }) => {
  cerrarSesion(cookies);
  return redirect(url.searchParams.get('locale') === 'en' ? '/en' : '/', 303);
};
