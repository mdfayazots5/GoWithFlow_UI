import { DUMMY_USERS } from '@/data/dummy/user.dummy';

export const isDemo = true; // Hardcoded to true for this environment as requested

export const demoService = {
  get isDemo() {
    return isDemo;
  },
  getUsers() {
    return DUMMY_USERS;
  },
  // Add other dummy fetchers as needed in future phases
};
