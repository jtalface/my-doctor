/**
 * Seed Doctor Script
 * 
 * Creates a test doctor account with credentials.
 * Run with: pnpm seed
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment files in order of priority (same as config)
const envFiles = [
  path.resolve(__dirname, '../../.env.development'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../../webapp-backend/.env.development'),
  path.resolve(__dirname, '../../../webapp-backend/.env.local'),
  path.resolve(__dirname, '../../../../.env.local'),
];

for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`Loaded ${path.basename(envPath)} from ${path.dirname(envPath)}`);
  }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydoctor';

// Provider schema (same as model)
const ProviderSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, lowercase: true },
  passwordHash: String,
  specialty: String,
  title: String,
  licenseNumber: String,
  avatarUrl: String,
  phone: String,
  bio: String,
  languages: [String],
  isActive: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastActiveAt: Date,
  lastLoginAt: Date,
  workingHours: {
    start: String,
    end: String,
    timezone: String,
    daysOfWeek: [Number],
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
  },
}, { timestamps: true });

const Provider = mongoose.model('Provider', ProviderSchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const testDoctors = [
      {
        email: 'doctor@mydoctor.com',
        password: 'Doctor123!',
        firstName: 'Maria',
        lastName: 'Silva',
        specialty: 'General Medicine',
        title: 'Dr.',
        licenseNumber: 'MOZ-2024-001',
        phone: '+258 84 123 4567',
        bio: 'General practitioner with 15 years of experience. Specializing in family medicine and preventive care.',
        languages: ['pt', 'en'],
        workingHours: {
          start: '08:00',
          end: '17:00',
          timezone: 'Africa/Maputo',
          daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
        },
      },
      {
        email: 'pediatrician@mydoctor.com',
        password: 'Doctor123!',
        firstName: 'João',
        lastName: 'Santos',
        specialty: 'Pediatrics',
        title: 'Dr.',
        licenseNumber: 'MOZ-2024-002',
        phone: '+258 84 987 6543',
        bio: 'Pediatrician specializing in child development and preventive care for children ages 0-18.',
        languages: ['pt', 'en'],
        workingHours: {
          start: '09:00',
          end: '18:00',
          timezone: 'Africa/Maputo',
          daysOfWeek: [1, 2, 3, 4, 5],
        },
      },
    ];

    for (const doc of testDoctors) {
      const existing = await Provider.findOne({ email: doc.email });
      
      if (existing) {
        // Update password if exists
        const passwordHash = await bcrypt.hash(doc.password, 12);
        await Provider.updateOne(
          { email: doc.email },
          { 
            $set: { 
              passwordHash,
              isVerified: true,
              ...doc,
            } 
          }
        );
        console.log(`✓ Updated doctor: ${doc.email}`);
      } else {
        // Create new doctor
        const passwordHash = await bcrypt.hash(doc.password, 12);
        await Provider.create({
          ...doc,
          passwordHash,
          isActive: true,
          isAvailable: true,
          isVerified: true,
        });
        console.log(`✓ Created doctor: ${doc.email}`);
      }
    }

    console.log('\n=== Test Doctor Credentials ===');
    console.log('Email: doctor@mydoctor.com');
    console.log('Password: Doctor123!');
    console.log('\nEmail: pediatrician@mydoctor.com');
    console.log('Password: Doctor123!');
    console.log('================================\n');

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();

