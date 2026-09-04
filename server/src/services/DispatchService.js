import dispatchRepository from '../repositories/DispatchRepository.js';
import inventoryRepository from '../repositories/InventoryRepository.js';
import ApiError from '../utils/ApiError.js';
import auditService from './AuditService.js';
import requestService from './RequestService.js';
import { DISPATCH_STATUS, DESTINATION_TYPES, REQUEST_STATUS } from '../constants/enums.js';
import { generateTrackingCode } from '../utils/trackingCode.js';

class DispatchService {
  /**
   * Creating an order subtracts stock (feature 12). Each line is decremented
   * with a guarded update; if one line fails we put back the lines already taken
   * rather than leaving the warehouse short. MongoDB transactions would be
   * cleaner, but they need a replica set, which a course project usually is not.
   */
  async create(payload, actor) {
    const taken = [];

    try {
      const lines = [];

      for (const line of payload.items) {
        const item = await inventoryRepository.findById(line.inventoryItem);
        if (!item) throw new ApiError(404, 'One of those items is no longer in stock');

        const updated = await inventoryRepository.decrement(line.inventoryItem, line.quantity);
        if (!updated) {
          throw new ApiError(409, `Not enough ${item.name} — only ${item.quantity} ${item.unit} left`);
        }

        taken.push({ id: line.inventoryItem, quantity: line.quantity });
        lines.push({ inventoryItem: item._id, name: item.name, quantity: line.quantity });
      }

      const order = await dispatchRepository.create({
        reference: generateTrackingCode().replace('DA-', 'DSP-'),
        warehouse: payload.warehouse,
        destinationType: payload.destinationType,
        destinationShelter: payload.destinationShelter || null,
        destinationRequest: payload.destinationRequest || null,
        items: lines,
        routeNotes: payload.routeNotes || '',
        createdBy: actor._id,
      });

      await auditService.record({
        actor,
        action: 'DISPATCH_CREATED',
        entityType: 'DispatchOrder',
        entityId: order._id,
        summary: `Dispatch ${order.reference} created with ${lines.length} line(s)`,
      });

      return order.toJSON();
    } catch (error) {
      for (const line of taken) {
        await inventoryRepository.increment(line.id, line.quantity);
      }
      throw error;
    }
  }

  async list(query) {
    const orders = await dispatchRepository.recent(query);
    return { orders: orders.map((o) => o.toJSON()) };
  }

  async updateStatus(id, status, actor) {
    const order = await dispatchRepository.updateById(id, { status });
    if (!order) throw new ApiError(404, 'Dispatch order not found');

    // Dispatching against a request moves the request along with it.
    if (order.destinationType === DESTINATION_TYPES.REQUEST && order.destinationRequest) {
      const nextRequestStatus =
        status === DISPATCH_STATUS.DISPATCHED
          ? REQUEST_STATUS.DISPATCHED
          : status === DISPATCH_STATUS.DELIVERED
            ? REQUEST_STATUS.DELIVERED
            : null;

      if (nextRequestStatus) {
        await requestService
          .changeStatus(order.destinationRequest, nextRequestStatus, actor, `Dispatch ${order.reference}`)
          .catch((error) => console.warn('[dispatch] request status not advanced:', error.message));
      }
    }

    await auditService.record({
      actor,
      action: 'DISPATCH_STATUS_CHANGED',
      entityType: 'DispatchOrder',
      entityId: id,
      summary: `Dispatch ${order.reference} marked ${status}`,
    });

    return order.toJSON();
  }

  async setRouteNotes(id, routeNotes, actor) {
    const order = await dispatchRepository.updateById(id, { routeNotes });
    if (!order) throw new ApiError(404, 'Dispatch order not found');

    await auditService.record({
      actor,
      action: 'ROUTE_NOTES_UPDATED',
      entityType: 'DispatchOrder',
      entityId: id,
      summary: `Route notes updated on ${order.reference}`,
    });

    return order.toJSON();
  }
}

export default new DispatchService();
