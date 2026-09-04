import requestService from './RequestService.js';
import shelterService from './ShelterService.js';
import inventoryService from './InventoryService.js';
import taskRepository from '../repositories/TaskRepository.js';
import volunteerRepository from '../repositories/VolunteerRepository.js';
import { TASK_STATUS } from '../constants/enums.js';

class DashboardService {
  async summary() {
    const [requests, occupancy, inventory, openTasks, availableVolunteers] = await Promise.all([
      requestService.statusSummary(),
      shelterService.occupancySummary(),
      inventoryService.summary(),
      taskRepository.count({ status: { $in: [TASK_STATUS.PENDING, TASK_STATUS.IN_PROGRESS] } }),
      volunteerRepository.count({ isAvailable: true }),
    ]);

    return { requests, occupancy, inventory, openTasks, availableVolunteers };
  }
}

export default new DashboardService();
