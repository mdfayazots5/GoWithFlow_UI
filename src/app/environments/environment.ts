export const environment = {
  production: import.meta.env.PROD,
  apiBaseUrl: import.meta.env.PROD
    ? 'https://gowithflow-api.onrender.com/api'
    : 'https://localhost:44378/api',
  wsBaseUrl: import.meta.env.PROD
    ? 'https://gowithflow-api.onrender.com'
    : 'https://localhost:44378'
};
