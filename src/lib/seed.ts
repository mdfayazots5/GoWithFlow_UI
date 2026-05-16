import { collection, addDoc, serverTimestamp, setDoc, doc, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';

const SCRIPTS = [
  {
    title: "Ordering Coffee in London",
    topic: "Daily Life",
    level: "Beginner",
    language: "English",
    duration: "3 mins",
    targetAge: "Adults",
    utterances: [
      { speaker: "Customer", prompt: "Hello, I'd like a flat white please.", englishText: "Hello, I'd like a flat white please." },
      { speaker: "Barista", prompt: "Sure thing. Small or large?", englishText: "Sure thing. Small or large?" },
      { speaker: "Customer", prompt: "Small, to go. And a croissant.", englishText: "Small, to go. And a croissant." },
      { speaker: "Barista", prompt: "That will be five fifty. Would you like a receipt?", englishText: "That will be five fifty. Would you like a receipt?" }
    ]
  },
  {
    title: "Talking about Hobbies",
    topic: "Social",
    level: "Intermediate",
    language: "English",
    duration: "5 mins",
    targetAge: "Teens/Adults",
    utterances: [
      { speaker: "Person A", prompt: "So, what do you usually do in your free time?", englishText: "So, what do you usually do in your free time?" },
      { speaker: "Person B", prompt: "I'm really into gardening. It's quite relaxing.", englishText: "I'm really into gardening. It's quite relaxing." },
      { speaker: "Person A", prompt: "That sounds lovely! What do you grow?", englishText: "That sounds lovely! What do you grow?" },
      { speaker: "Person B", prompt: "Mostly herbs and some tomatoes. It's rewarding to eat what you grow.", englishText: "Mostly herbs and some tomatoes. It's rewarding to eat what you grow." }
    ]
  }
];

const DUMMY_USERS = [
  {
    id: "guru_demo",
    fullName: "Guru Rajesh",
    role: "guru",
    mobile: "9876543210",
    ageGroup: "Adult (18+)",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh",
    preferredHintLanguage: "Telugu",
    dailyStreakCount: 15,
    totalSessionsPlayed: 45,
    active: true
  },
  {
    id: "mate_demo",
    fullName: "Skill Mate Arjun",
    role: "mate",
    mobile: "9123456789",
    ageGroup: "Adult (18+)",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
    preferredHintLanguage: "Telugu",
    dailyStreakCount: 7,
    totalSessionsPlayed: 23,
    active: true
  }
];

export async function seedDatabase() {
  console.log("Starting Seeding...");
  
  // 1. Seed Scripts
  const scriptsRef = collection(db, 'scripts');
  const existingScripts = await getDocs(query(scriptsRef, limit(1)));
  if (existingScripts.empty) {
    for (const script of SCRIPTS) {
      await addDoc(scriptsRef, {
        ...script,
        createdDate: new Date().toISOString()
      });
    }
    console.log("Scripts Seeded");
  }

  // 2. Seed Users
  for (const dummyUser of DUMMY_USERS) {
    const userRef = doc(db, 'users', dummyUser.id);
    await setDoc(userRef, {
      ...dummyUser,
      registrationDate: serverTimestamp()
    }, { merge: true });
  }
  console.log("Users Seeded");

  // 3. Seed Sessions
  const sessionsRef = collection(db, 'sessions');
  const existingSessions = await getDocs(query(sessionsRef, limit(1)));
  if (existingSessions.empty) {
    await addDoc(sessionsRef, {
      sessionName: "Family Reunion Practice",
      joinCode: "REUNION",
      sessionMode: "Story Roleplay",
      maxMembers: 4,
      sessionDuration: 30,
      hostId: "guru_demo",
      status: "COMPLETED",
      createdDate: new Date(Date.now() - 86400000).toISOString(),
      roomExpiry: 2,
    });
    
    await addDoc(sessionsRef, {
      sessionName: "Morning Coffee Drill",
      joinCode: "COFFEE",
      sessionMode: "Echo/Drill",
      maxMembers: 2,
      sessionDuration: 15,
      hostId: "guru_demo",
      status: "COMPLETED",
      createdDate: new Date(Date.now() - 172800000).toISOString(),
      roomExpiry: 2,
    });
    console.log("Sessions Seeded");
  }
  
  console.log("Seeding Complete!");
}
