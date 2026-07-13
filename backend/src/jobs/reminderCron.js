const cron = require("node-cron");
const Lead = require("../models/Lead");
const Booking = require("../models/Booking");
const notify = require("../utils/notify");

// Follow-ups due within the next hour (or already overdue), not yet reminded
const checkFollowUps = async () => {
  const soon = new Date(Date.now() + 60 * 60 * 1000);
  const leads = await Lead.find({
    isDeleted: false,
    followUps: { $elemMatch: { isCompleted: false, reminderSent: false, scheduledAt: { $lte: soon } } },
  });

  for (const lead of leads) {
    for (const f of lead.followUps) {
      if (!f.isCompleted && !f.reminderSent && f.scheduledAt <= soon) {
        await notify({
          agencyId: lead.agencyId, recipient: lead.assignedAgent, type: "FollowUpReminder",
          title: "Follow-up due", message: `${lead.customer.name} — ${new Date(f.scheduledAt).toLocaleString()}`,
          lead: lead._id,
        });
        f.reminderSent = true;
      }
    }
    await lead.save();
  }
};

// Installments due within 3 days, not yet reminded; flip clearly overdue ones to "Overdue"
const checkInstallments = async () => {
  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const bookings = await Booking.find({
    isDeleted: false, status: { $nin: ["Completed", "Cancelled"] },
    installments: { $elemMatch: { status: "Pending", dueDate: { $lte: soon } } },
  });

  for (const booking of bookings) {
    for (const inst of booking.installments) {
      if (inst.status !== "Pending") continue;
      if (inst.dueDate < new Date()) inst.status = "Overdue";
      if (!inst.reminderSent && inst.dueDate <= soon) {
        await notify({
          agencyId: booking.agencyId, recipient: null, type: "InstallmentReminder",
          title: "Installment due", message: `Unit ${booking.unitNumber} — ₹${inst.amount} due ${new Date(inst.dueDate).toLocaleDateString()}`,
          booking: booking._id,
        });
        inst.reminderSent = true;
      }
    }
    await booking.save();
  }
};

// Runs every 15 minutes. (During local demo/testing you can temporarily change
// this to "*/1 * * * *" to see reminders fire within a minute instead of waiting.)
const startReminderCron = () => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      await checkFollowUps();
      await checkInstallments();
    } catch (err) {
      console.error("Reminder cron failed:", err.message);
    }
  });
};

module.exports = startReminderCron;