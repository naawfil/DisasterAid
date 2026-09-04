import inventoryRepository from '../repositories/InventoryRepository.js';
import aidRequestRepository from '../repositories/AidRequestRepository.js';
import shelterRepository from '../repositories/ShelterRepository.js';
import ApiError from '../utils/ApiError.js';
import auditService from './AuditService.js';

/** Quotes a value so commas, quotes and newlines survive the round trip. */
const escape = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (headers, rows) =>
  [headers.join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');

class ExportService {
  async inventoryCsv() {
    const items = await inventoryRepository.findByWarehouse();
    return toCsv(
      ['Warehouse', 'Item', 'Category', 'Quantity', 'Unit', 'Low stock threshold', 'Low stock'],
      items.map((i) => [
        i.warehouse?.name ?? '',
        i.name,
        i.category,
        i.quantity,
        i.unit,
        i.lowStockThreshold,
        i.isLowStock ? 'YES' : 'NO',
      ])
    );
  }

  async requestsCsv() {
    const requests = await aidRequestRepository.findForQueue({ limit: 5000 });
    return toCsv(
      ['Tracking code', 'Name', 'Phone', 'Status', 'Priority', 'Items', 'Address', 'Latitude', 'Longitude', 'Submitted'],
      requests.map((r) => [
        r.trackingCode,
        r.requesterName,
        r.contactPhone,
        r.status,
        r.priority,
        r.items.map((i) => `${i.note || i.category} x${i.quantity}`).join('; '),
        r.address,
        r.location?.coordinates?.[1] ?? '',
        r.location?.coordinates?.[0] ?? '',
        r.createdAt.toISOString(),
      ])
    );
  }

  async sheltersCsv() {
    const shelters = await shelterRepository.find({}, { limit: 5000 });
    return toCsv(
      ['Shelter', 'Address', 'Capacity', 'Headcount', 'Remaining', 'Amenities', 'Open'],
      shelters.map((s) => [
        s.name,
        s.address,
        s.maxCapacity,
        s.currentHeadcount,
        s.remainingSpots,
        s.amenities.join('; '),
        s.isOpen ? 'YES' : 'NO',
      ])
    );
  }

  async build(dataset, actor) {
    const builders = {
      inventory: () => this.inventoryCsv(),
      requests: () => this.requestsCsv(),
      shelters: () => this.sheltersCsv(),
    };

    const builder = builders[dataset];
    if (!builder) throw new ApiError(400, 'Unknown export. Choose inventory, requests or shelters.');

    const csv = await builder();

    await auditService.record({
      actor,
      action: 'DATA_EXPORTED',
      entityType: 'Export',
      summary: `${actor.name} exported the ${dataset} CSV`,
    });

    return { csv, filename: `disasteraid-${dataset}-${new Date().toISOString().slice(0, 10)}.csv` };
  }
}

export default new ExportService();
