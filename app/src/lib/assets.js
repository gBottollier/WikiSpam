// Les assets partagés (images, etc.) vivent à la racine du site déployé
// (https://gbottollier.github.io/WikiSpam/) alors que l'app Vue est sous /app/.
// import.meta.env.BASE_URL vaut '/WikiSpam/app/' -> on retire 'app/'.
export const SITE_BASE = import.meta.env.BASE_URL.replace(/app\/?$/, '')

/** Construit l'URL d'un asset partagé, ex: asset('img/avatar/x.webp'). */
export function asset(pathname) {
  return SITE_BASE + String(pathname).replace(/^\/+/, '')
}
