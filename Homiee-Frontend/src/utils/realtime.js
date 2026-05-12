export function getHubUrl(pathname) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5276/api';
  const rootUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  return `${rootUrl}${pathname}`;
}
