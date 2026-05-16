import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Session, Mistake } from '@/types';

class UserService {
  async getProfile(userId: string): Promise<User | null> {
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as User : null;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', userId), data);
  }

  async getSessionHistory(userId: string): Promise<Session[]> {
    // Note: This requires a composite index in production, but for dev we use a simpler query if needed
    const q = query(
      collection(db, 'sessions'),
      orderBy('createdDate', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    // In a real app, we filter by membership in the members subcollection or a denormalized memberIds array
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Session));
  }

  async getSessionDetail(sessionId: string): Promise<Session | null> {
    const snap = await getDoc(doc(db, 'sessions', sessionId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Session : null;
  }
}

export const userService = new UserService();
