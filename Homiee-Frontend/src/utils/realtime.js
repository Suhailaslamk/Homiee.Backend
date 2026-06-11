export function getHubUrl(pathname) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const rootUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  return `${rootUrl}${pathname}`;
}
