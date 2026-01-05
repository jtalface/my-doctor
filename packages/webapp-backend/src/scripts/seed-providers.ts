/**
 * Seed Providers Script
 * 
 * Creates test healthcare providers for development.
 * Run with: npx tsx src/scripts/seed-providers.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { Provider } from '../models/provider.model.js';
import { config } from '../config/index.js';

const testProviders = [
  {
    name: 'Dr. Maria Silva',
    email: 'maria.silva@zambe.health',
    specialty: 'Medicina Geral',
    title: 'Dr.',
    bio: 'Médica de família com mais de 10 anos de experiência em cuidados primários.',
    languages: ['Português', 'English'],
    isActive: true,
    isAvailable: true,
    lastActiveAt: new Date(),
    workingHours: {
      start: '08:00',
      end: '17:00',
      timezone: 'Africa/Maputo',
      daysOfWeek: [1, 2, 3, 4, 5],
    },
  },
  {
    name: 'Dr. João Machava',
    email: 'joao.machava@zambe.health',
    specialty: 'Pediatria',
    title: 'Dr.',
    bio: 'Pediatra especializado em saúde infantil e vacinação.',
    languages: ['Português', 'Swahili'],
    isActive: true,
    isAvailable: true,
    lastActiveAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
    workingHours: {
      start: '09:00',
      end: '18:00',
      timezone: 'Africa/Maputo',
      daysOfWeek: [1, 2, 3, 4, 5],
    },
  },
  {
    name: 'Enf. Ana Tembe',
    email: 'ana.tembe@zambe.health',
    specialty: 'Enfermagem',
    title: 'Enf.',
    bio: 'Enfermeira com especialização em saúde comunitária e educação para a saúde.',
    languages: ['Português', 'Changana'],
    isActive: true,
    isAvailable: false,
    lastActiveAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    workingHours: {
      start: '07:00',
      end: '16:00',
      timezone: 'Africa/Maputo',
      daysOfWeek: [1, 2, 3, 4, 5, 6],
    },
  },
  {
    name: 'Dr. Carlos Matsinhe',
    email: 'carlos.matsinhe@zambe.health',
    specialty: 'Medicina Interna',
    title: 'Dr.',
    bio: 'Especialista em doenças crónicas e medicina preventiva.',
    languages: ['Português', 'English', 'French'],
    isActive: true,
    isAvailable: true,
    lastActiveAt: new Date(),
    workingHours: {
      start: '08:30',
      end: '17:30',
      timezone: 'Africa/Maputo',
      daysOfWeek: [1, 2, 3, 4, 5],
    },
  },
];

async function seedProviders() {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('[Seed] Connected to MongoDB');

    console.log('[Seed] Seeding providers...');
    
    for (const providerData of testProviders) {
      // Check if provider already exists
      const existing = await Provider.findOne({ email: providerData.email });
      
      if (existing) {
        console.log(`[Seed] Provider ${providerData.name} already exists, updating...`);
        await Provider.updateOne({ email: providerData.email }, providerData);
      } else {
        console.log(`[Seed] Creating provider ${providerData.name}...`);
        await Provider.create(providerData);
      }
    }

    console.log('[Seed] Done! Created/updated providers:');
    const providers = await Provider.find({}).select('name email specialty isActive');
    providers.forEach(p => {
      console.log(`  - ${p.name} (${p.specialty}) - ${p.isActive ? 'Active' : 'Inactive'}`);
    });

    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error:', error);
    process.exit(1);
  }
}

seedProviders();

