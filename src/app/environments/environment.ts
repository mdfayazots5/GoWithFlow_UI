const devOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://10.147.254.186:4200';

export const environment = {
  production: import.meta.env.PROD,
  apiBaseUrl: import.meta.env.PROD
    ? 'https://gowithflow-api.onrender.com/api'
    : `${devOrigin}/api`,
  wsBaseUrl: import.meta.env.PROD
    ? 'https://gowithflow-api.onrender.com'
    : devOrigin
};
