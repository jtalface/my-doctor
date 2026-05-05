import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { ScreeningItem } from '../models/screening-item.model.js';
import { screeningIntervals } from './screeningIntervals.js';

async function seed() {
  await mongoose.connect(config.mongodbUri);

  const docs = Object.values(screeningIntervals).map((item) => ({
    code: item.code,
    isActive: true,
    defaultMinIntervalYears: item.yearsMin,
    defaultMaxIntervalYears: item.yearsMax,
  }));

  for (const doc of docs) {
    await ScreeningItem.findOneAndUpdate({ code: doc.code }, { $set: doc }, { upsert: true, new: true });
  }

  console.log(`[preventive-seed] Upserted ${docs.length} screening items.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('[preventive-seed] Failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
