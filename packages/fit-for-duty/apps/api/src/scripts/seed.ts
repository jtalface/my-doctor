import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { User, Location, JobRole, Template } from '../models/index.js';
import { hashPassword } from '../services/auth.service.js';
import {
  UserRole,
  LocationType,
  JobRoleTag,
  DEFAULT_TEMPLATE_SECTIONS,
  DEFAULT_TEMPLATE_NAME,
} from '@ffd/shared';

async function seed() {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('[Seed] Connected');
    
    // Check if already seeded
    const existingAdmin = await User.findOne({ role: UserRole.ADMIN });
    if (existingAdmin) {
      console.log('[Seed] Database already seeded. Skipping...');
      await mongoose.disconnect();
      return;
    }
    
    console.log('[Seed] Creating admin user...');
    const adminPasswordHash = await hashPassword(config.admin.password);
    const admin = await User.create({
      name: config.admin.name,
      email: config.admin.email.toLowerCase(),
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      locationIds: [],
      isActive: true,
    });
    console.log(`[Seed] Admin created: ${admin.email}`);
    
    console.log('[Seed] Creating locations...');
    const locations = await Location.insertMany([
      {
        name: 'Temane Gas Processing Facility',
        type: LocationType.ONSHORE,
        region: 'Inhambane',
        isActive: true,
      },
      {
        name: 'Coral Sul FLNG',
        type: LocationType.OFFSHORE,
        region: 'Rovuma Basin',
        isActive: true,
      },
      {
        name: 'Matola Refinery',
        type: LocationType.REFINERY,
        region: 'Maputo',
        isActive: true,
      },
      {
        name: 'ROMPCO Pipeline Station 4',
        type: LocationType.PIPELINE,
        region: 'Gaza',
        isActive: true,
      },
    ]);
    console.log(`[Seed] Created ${locations.length} locations`);
    
    console.log('[Seed] Creating job roles...');
    const jobRoles = await JobRole.insertMany([
      {
        name: 'Process Operator',
        safetyCritical: true,
        tags: [JobRoleTag.H2S],
        isActive: true,
      },
      {
        name: 'Crane Operator',
        safetyCritical: true,
        tags: [JobRoleTag.CRANE, JobRoleTag.HEAVY_EQUIPMENT],
        isActive: true,
      },
      {
        name: 'Scaffolder',
        safetyCritical: true,
        tags: [JobRoleTag.WORKING_AT_HEIGHTS],
        isActive: true,
      },
      {
        name: 'Electrician',
        safetyCritical: true,
        tags: [JobRoleTag.ELECTRICAL],
        isActive: true,
      },
      {
        name: 'Confined Space Entrant',
        safetyCritical: true,
        tags: [JobRoleTag.CONFINED_SPACE, JobRoleTag.H2S],
        isActive: true,
      },
      {
        name: 'Heavy Equipment Operator',
        safetyCritical: true,
        tags: [JobRoleTag.HEAVY_EQUIPMENT],
        isActive: true,
      },
      {
        name: 'Administrative Staff',
        safetyCritical: false,
        tags: [],
        isActive: true,
      },
      {
        name: 'HSE Officer',
        safetyCritical: false,
        tags: [],
        isActive: true,
      },
    ]);
    console.log(`[Seed] Created ${jobRoles.length} job roles`);
    
    console.log('[Seed] Creating checklist template...');
    const template = await Template.create({
      name: DEFAULT_TEMPLATE_NAME,
      version: 1,
      sections: DEFAULT_TEMPLATE_SECTIONS,
      isActive: true,
    });
    console.log(`[Seed] Created template: ${template.name} v${template.version}`);
    
    // Create sample assessor user
    console.log('[Seed] Creating sample assessor...');
    const assessorPasswordHash = await hashPassword('Assessor123!');
    const assessor = await User.create({
      name: 'John Assessor',
      email: 'assessor@ffd.local',
      passwordHash: assessorPasswordHash,
      role: UserRole.ASSESSOR,
      locationIds: [locations[0]._id],
      isActive: true,
    });
    console.log(`[Seed] Assessor created: ${assessor.email}`);
    
    // Create sample viewer user
    console.log('[Seed] Creating sample viewer...');
    const viewerPasswordHash = await hashPassword('Viewer123!');
    const viewer = await User.create({
      name: 'Jane Viewer',
      email: 'viewer@ffd.local',
      passwordHash: viewerPasswordHash,
      role: UserRole.VIEWER,
      locationIds: [],
      isActive: true,
    });
    console.log(`[Seed] Viewer created: ${viewer.email}`);
    
    console.log('');
    console.log('='.repeat(50));
    console.log('  Seed Complete!');
    console.log('='.repeat(50));
    console.log('');
    console.log('  Login credentials:');
    console.log('');
    console.log(`  Admin:    ${config.admin.email} / ${config.admin.password}`);
    console.log(`  Assessor: assessor@ffd.local / Assessor123!`);
    console.log(`  Viewer:   viewer@ffd.local / Viewer123!`);
    console.log('');
    console.log('='.repeat(50));
    
    await mongoose.disconnect();
    console.log('[Seed] Done');
  } catch (error) {
    console.error('[Seed] Error:', error);
    process.exit(1);
  }
}

seed();
