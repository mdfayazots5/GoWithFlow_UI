export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    VERIFY_OTP: '/api/auth/verify-otp',
    REGISTER: '/api/auth/register',
  },
  USER: {
    PROFILE: '/api/user/profile',
    STATS: '/api/user/stats',
    HISTORY: '/api/user/history',
  },
  SESSION: {
    CREATE: '/api/session/create',
    JOIN: '/api/session/join',
    LOBBY: (id: string) => `/api/session/lobby/${id}`,
    START: (id: string) => `/api/session/start/${id}`,
  },
  SCRIPTS: {
    LIST: '/api/scripts/list',
    DETAIL: (id: string) => `/api/scripts/${id}`,
    UPLOAD: '/api/scripts/upload',
  },
  MISTAKES: {
    LIST: '/api/mistakes/list',
    RESOLVE: (id: string) => `/api/mistakes/resolve/${id}`,
  },
  REPRACTICE: {
    CREATE: '/api/repractice/create',
    DETAIL: (id: string) => `/api/repractice/${id}`,
  },
  ADMIN: {
    USERS: '/api/admin/users',
    REPORTS: '/api/admin/reports',
    SCRIPTS: '/api/admin/scripts',
  }
};
