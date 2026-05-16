import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { DUMMY_USERS } from '../../data/dummy/user.dummy';

@Injectable({
  providedIn: 'root'
})
export class DemoService {
  get isDemo(): boolean {
    return environment.isDemo;
  }

  getUsers() {
    return DUMMY_USERS;
  }

  // Placeholders for future phases
  getSessions() { return []; }
  getScripts() { return []; }
  getMistakes() { return []; }
  getReports() { return []; }
}
