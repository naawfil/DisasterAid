/**
 * One-time (and safe to re-run) repair for VolunteerProfile.activeTaskCount /
 * completedTaskCount. Those two fields are denormalized counters, bumped by
 * $inc calls scattered across TaskService rather than computed on read — a
 * bug in that bumping logic (fixed alongside this script) let them drift
 * out of sync with the actual Task documents, in at least one case landing
 * on a negative activeTaskCount.
 *
 * This recomputes both counters from the Task collection — the real source
 * of truth — and overwrites whatever is currently stored, for every
 * volunteer profile. Run with `npm run reconcile:volunteers`.
 */
import database from '../config/database.js';
import VolunteerProfile from '../models/VolunteerProfile.js';
import Task from '../models/Task.js';
import { TASK_STATUS } from '../constants/enums.js';

const run = async () => {
  await database.connect();

  const profiles = await VolunteerProfile.find({});
  let corrected = 0;

  for (const profile of profiles) {
    const [activeTaskCount, completedTaskCount] = await Promise.all([
      Task.countDocuments({
        assignedTo: profile.user,
        status: { $in: [TASK_STATUS.PENDING, TASK_STATUS.IN_PROGRESS] },
      }),
      Task.countDocuments({ assignedTo: profile.user, status: TASK_STATUS.COMPLETED }),
    ]);

    if (profile.activeTaskCount !== activeTaskCount || profile.completedTaskCount !== completedTaskCount) {
      console.log(
        `[reconcile] volunteer ${profile.user}: ` +
          `active ${profile.activeTaskCount} -> ${activeTaskCount}, ` +
          `completed ${profile.completedTaskCount} -> ${completedTaskCount}`
      );
      profile.activeTaskCount = activeTaskCount;
      profile.completedTaskCount = completedTaskCount;
      await profile.save();
      corrected += 1;
    }
  }

  console.log(`[reconcile] checked ${profiles.length} volunteer profile(s), corrected ${corrected}`);

  await database.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('[reconcile] failed:', error);
  process.exit(1);
});
