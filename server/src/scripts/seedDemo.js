/**
 * Fills the database with enough believable data to demo every screen.
 * Run after seed:admin — `npm run seed:demo`. Safe to re-run.
 */
import database from '../config/database.js';
import userRepository from '../repositories/UserRepository.js';
import shelterRepository from '../repositories/ShelterRepository.js';
import warehouseRepository from '../repositories/WarehouseRepository.js';
import inventoryRepository from '../repositories/InventoryRepository.js';
import aidRequestRepository from '../repositories/AidRequestRepository.js';
import announcementRepository from '../repositories/AnnouncementRepository.js';
import volunteerRepository from '../repositories/VolunteerRepository.js';
import { ROLES } from '../constants/roles.js';
import { AID_CATEGORIES, AMENITIES, PRIORITY, SEVERITY } from '../constants/enums.js';
import { generateTrackingCode } from '../utils/trackingCode.js';

const ensureUser = async (details) => {
  const existing = await userRepository.findByEmail(details.email);
  if (existing) return existing;
  return userRepository.create(details);
};

const run = async () => {
  await database.connect();

  const manager = await ensureUser({
    name: 'Nusrat Jahan',
    email: 'manager@disasteraid.local',
    password: 'Manager123!',
    role: ROLES.RELIEF_MANAGER,
    phone: '01710000001',
  });

  const shelterManager = await ensureUser({
    name: 'Farhana Akter',
    email: 'shelter@disasteraid.local',
    password: 'Shelter123!',
    role: ROLES.SHELTER_MANAGER,
    phone: '01710000004',
  });

  const volunteers = await Promise.all([
    ensureUser({ name: 'Arif Hossain', email: 'arif@disasteraid.local', password: 'Volunteer123!', role: ROLES.VOLUNTEER, phone: '01710000002' }),
    ensureUser({ name: 'Sadia Rahman', email: 'sadia@disasteraid.local', password: 'Volunteer123!', role: ROLES.VOLUNTEER, phone: '01710000003' }),
  ]);

  for (const [index, volunteer] of volunteers.entries()) {
    const profile = await volunteerRepository.findByUser(volunteer._id);
    if (!profile) {
      await volunteerRepository.create({
        user: volunteer._id,
        skills: index === 0 ? ['DRIVER', 'HEAVY_LIFTING'] : ['FIRST_AID', 'COOKING'],
        baseArea: index === 0 ? 'Mirpur' : 'Uttara',
      });
    }
  }

  if ((await shelterRepository.count()) === 0) {
    await shelterRepository.create({
      name: 'Mirpur Government School Shelter',
      address: 'Mirpur 10, Dhaka',
      location: { type: 'Point', coordinates: [90.3654, 23.8069] },
      maxCapacity: 400,
      currentHeadcount: 275,
      amenities: [AMENITIES.POWER, AMENITIES.DRINKING_WATER, AMENITIES.HALAL_MEALS],
      manager: manager._id,
      contactPhone: '01710000010',
    });

    await shelterRepository.create({
      name: 'Uttara Community Centre',
      address: 'Sector 7, Uttara, Dhaka',
      location: { type: 'Point', coordinates: [90.3983, 23.8759] },
      maxCapacity: 250,
      currentHeadcount: 240,
      amenities: [AMENITIES.MEDICAL_UNIT, AMENITIES.WHEELCHAIR_ACCESS, AMENITIES.PET_FRIENDLY],
      manager: shelterManager._id,
      contactPhone: '01710000011',
    });
  }

  let warehouse = await warehouseRepository.findOne({ name: 'Central Relief Depot' });
  if (!warehouse) {
    warehouse = await warehouseRepository.create({
      name: 'Central Relief Depot',
      address: 'Tejgaon Industrial Area, Dhaka',
      manager: manager._id,
    });

    await inventoryRepository.create({ warehouse: warehouse._id, name: 'Rice sack (25kg)', category: AID_CATEGORIES.FOOD, unit: 'sack', quantity: 180, lowStockThreshold: 50 });
    await inventoryRepository.create({ warehouse: warehouse._id, name: 'Water (10L jerrycan)', category: AID_CATEGORIES.WATER, unit: 'can', quantity: 32, lowStockThreshold: 60 });
    await inventoryRepository.create({ warehouse: warehouse._id, name: 'Tarpaulin sheet', category: AID_CATEGORIES.SHELTER, unit: 'sheet', quantity: 95, lowStockThreshold: 40 });
    await inventoryRepository.create({ warehouse: warehouse._id, name: 'First aid kit', category: AID_CATEGORIES.MEDICAL, unit: 'kit', quantity: 12, lowStockThreshold: 25 });
  }

  if ((await aidRequestRepository.count()) === 0) {
    await aidRequestRepository.create({
      trackingCode: generateTrackingCode(),
      requesterName: 'Rahima Begum',
      contactPhone: '01810000001',
      householdSize: 6,
      items: [
        { category: AID_CATEGORIES.WATER, quantity: 4 },
        { category: AID_CATEGORIES.FOOD, quantity: 2 },
      ],
      location: { type: 'Point', coordinates: [90.372, 23.799] },
      address: 'Kallyanpur, Dhaka',
      notes: 'Ground floor flooded, two young children in the house.',
      priority: PRIORITY.HIGH,
      statusHistory: [{ status: 'PENDING', note: 'Submitted' }],
    });

    await aidRequestRepository.create({
      trackingCode: generateTrackingCode(),
      requesterName: 'Kamal Uddin',
      contactPhone: '01810000002',
      householdSize: 3,
      items: [{ category: AID_CATEGORIES.MEDICAL, quantity: 1 }],
      location: { type: 'Point', coordinates: [90.4125, 23.7925] },
      address: 'Banani, Dhaka',
      notes: 'Elderly father needs insulin, road is blocked.',
      priority: PRIORITY.CRITICAL,
      statusHistory: [{ status: 'PENDING', note: 'Submitted' }],
    });
  }

  if ((await announcementRepository.count()) === 0) {
    await announcementRepository.create({
      title: 'Water distribution at Mirpur 10 moved to 2 PM',
      body: 'The morning distribution is delayed because the access road is still under water. Bring your own containers if you can.',
      severity: SEVERITY.WARNING,
      area: 'Mirpur',
      publishedBy: manager._id,
      isPinned: true,
    });
  }

  console.log('[seed] demo data ready');
  console.log('       manager@disasteraid.local / Manager123!');
  console.log('       shelter@disasteraid.local / Shelter123!');
  console.log('       arif@disasteraid.local / Volunteer123!');

  await database.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('[seed] failed:', error);
  process.exit(1);
});
