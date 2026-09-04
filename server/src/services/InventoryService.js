import warehouseRepository from '../repositories/WarehouseRepository.js';
import inventoryRepository from '../repositories/InventoryRepository.js';
import donationRepository from '../repositories/DonationRepository.js';
import ApiError from '../utils/ApiError.js';
import auditService from './AuditService.js';

class InventoryService {
  async listWarehouses() {
    const warehouses = await warehouseRepository.listActive();
    return { warehouses: warehouses.map((w) => w.toJSON()) };
  }

  async createWarehouse(payload, actor) {
    const warehouse = await warehouseRepository.create(payload);
    await auditService.record({
      actor,
      action: 'WAREHOUSE_CREATED',
      entityType: 'Warehouse',
      entityId: warehouse._id,
      summary: `Warehouse ${warehouse.name} added`,
    });
    return warehouse.toJSON();
  }

  async listStock(warehouseId) {
    const items = await inventoryRepository.findByWarehouse(warehouseId);
    return { items: items.map((i) => i.toJSON()) };
  }

  async lowStock() {
    const items = await inventoryRepository.lowStock();
    return { items: items.map((i) => i.toJSON()) };
  }

  /**
   * Public, read-only stock snapshot — summed across every warehouse, with
   * nothing about which warehouse or its thresholds exposed. The aid-request
   * form uses this so a requester can only ask for what is actually stocked.
   */
  async publicCatalog() {
    const items = await inventoryRepository.availableCatalog();
    return { items };
  }

  async upsertItem(payload, actor) {
    const existing = await inventoryRepository.findOneInWarehouse(payload.warehouse, payload.name);

    if (existing) {
      const updated = await inventoryRepository.updateById(existing._id, {
        quantity: payload.quantity,
        lowStockThreshold: payload.lowStockThreshold ?? existing.lowStockThreshold,
        unit: payload.unit ?? existing.unit,
      });
      await auditService.record({
        actor,
        action: 'STOCK_ADJUSTED',
        entityType: 'InventoryItem',
        entityId: updated._id,
        summary: `${updated.name} set to ${updated.quantity} ${updated.unit}`,
      });
      return updated.toJSON();
    }

    const item = await inventoryRepository.create(payload);
    await auditService.record({
      actor,
      action: 'STOCK_ITEM_ADDED',
      entityType: 'InventoryItem',
      entityId: item._id,
      summary: `${item.name} added with ${item.quantity} ${item.unit}`,
    });
    return item.toJSON();
  }

  /**
   * Donation inflow (feature 10). Each donated line either tops up an existing
   * row or creates one, so the global count stays right without a separate
   * reconciliation step.
   */
  async logDonation(payload, actor) {
    const warehouse = await warehouseRepository.findById(payload.warehouse);
    if (!warehouse) throw new ApiError(404, 'Warehouse not found');

    for (const line of payload.items) {
      const existing = await inventoryRepository.findOneInWarehouse(payload.warehouse, line.name);
      if (existing) {
        await inventoryRepository.increment(existing._id, line.quantity);
      } else {
        await inventoryRepository.create({
          warehouse: payload.warehouse,
          name: line.name,
          category: line.category,
          unit: line.unit || 'unit',
          quantity: line.quantity,
        });
      }
    }

    const donation = await donationRepository.create({ ...payload, loggedBy: actor._id });

    await auditService.record({
      actor,
      action: 'DONATION_LOGGED',
      entityType: 'Donation',
      entityId: donation._id,
      summary: `${donation.items.length} line(s) donated by ${donation.donorName} into ${warehouse.name}`,
    });

    return donation.toJSON();
  }

  async listDonations(query) {
    const donations = await donationRepository.recent(query);
    return { donations: donations.map((d) => d.toJSON()) };
  }

  async summary() {
    const [items, low] = await Promise.all([inventoryRepository.count(), inventoryRepository.lowStock()]);
    return { trackedItems: items, lowStockCount: low.length };
  }
}

export default new InventoryService();
