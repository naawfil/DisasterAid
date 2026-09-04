/**
 * Creates the first admin so the RBAC chain has a starting point.
 * Run once: npm run seed:admin
 */
import database from '../config/database.js';
import userRepository from '../repositories/UserRepository.js';
import { ROLES } from '../constants/roles.js';

const run = async () => {
  await database.connect();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@disasteraid.local';
  const existing = await userRepository.findByEmail(email);

  if (existing) {
    console.log(`[seed] admin already exists: ${email}`);
  } else {
    await userRepository.create({
      name: process.env.SEED_ADMIN_NAME || 'System Admin',
      email,
      password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
      role: ROLES.ADMIN,
    });
    console.log(`[seed] admin created: ${email}`);
  }

  await database.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('[seed] failed:', error);
  process.exit(1);
});
