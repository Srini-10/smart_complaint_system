/**
 * Seed script - Creates initial departments and a super admin user
 * Run once after Firebase project setup:
 *   npx ts-node scripts/seed.ts
 *
 * Or paste into browser console after logging in as the first user,
 * then manually update their role in Firestore to 'super_admin'.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
    // Copy from your .env file
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const departments = [
    {
        name: 'Water & Sanitation',
        description: 'Handles water supply, drainage, and sanitation issues',
        categories: ['water', 'sanitation'],
        slaHours: 24,
        email: 'water@facility.com',
        phone: '+1-555-0101',
        location: 'Block A, Ground Floor',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    },
    {
        name: 'Electrical & Power',
        description: 'Manages electrical systems, power outages, and lighting',
        categories: ['electrical'],
        slaHours: 12,
        email: 'electrical@facility.com',
        phone: '+1-555-0102',
        location: 'Block B, Room 101',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    },
    {
        name: 'IT & Internet',
        description: 'Handles internet connectivity, network, and IT infrastructure',
        categories: ['internet'],
        slaHours: 8,
        email: 'it@facility.com',
        phone: '+1-555-0103',
        location: 'Block C, IT Room',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    },
    {
        name: 'Infrastructure & Maintenance',
        description: 'Manages building infrastructure, repairs, and general maintenance',
        categories: ['infrastructure', 'maintenance'],
        slaHours: 48,
        email: 'maintenance@facility.com',
        phone: '+1-555-0104',
        location: 'Block A, Room 201',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    },
    {
        name: 'Security',
        description: 'Handles security incidents, access control, and safety',
        categories: ['security'],
        slaHours: 4,
        email: 'security@facility.com',
        phone: '+1-555-0105',
        location: 'Main Gate',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    },
    {
        name: 'General Services',
        description: 'Handles miscellaneous complaints and general service requests',
        categories: ['other'],
        slaHours: 72,
        email: 'general@facility.com',
        phone: '+1-555-0106',
        location: 'Admin Block',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    },
];

async function seed() {
    console.log('Seeding departments...');
    for (const dept of departments) {
        const ref = await addDoc(collection(db, 'departments'), dept);
        console.log(`Created department: ${dept.name} (${ref.id})`);
    }
    console.log('✅ Seed complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Register your first user via the app');
    console.log('2. Go to Firebase Console > Firestore > users collection');
    console.log('3. Find your user document and set role to "super_admin"');
}

seed().catch(console.error);
