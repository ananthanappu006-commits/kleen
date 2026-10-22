/**
 * KLEEN — Notifications Manager
 */

import { db } from "../db-service.js";

class NotificationManager {
  getNotifications(userId) {
    const all = db.getSnapshot().notifications || [];
    if (!userId) return all;
    return all.filter(n => n.userId === userId || n.userId === "all");
  }

  markAsRead(notificationId) {
    const snapshot = db.getSnapshot();
    snapshot.notifications = (snapshot.notifications || []).map(n => {
      if (n.notificationId === notificationId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    db.saveSnapshot(snapshot, "notifications");
  }

  markAllAsRead(userId) {
    const snapshot = db.getSnapshot();
    snapshot.notifications = (snapshot.notifications || []).map(n => {
      if (!userId || n.userId === userId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    db.saveSnapshot(snapshot, "notifications");
  }

  sendBroadcast({ title, message, targetAudience }) {
    const snapshot = db.getSnapshot();
    const newNotif = {
      notificationId: "notif_" + Date.now(),
      userId: targetAudience === "customers" ? "all_customers" : (targetAudience === "partners" ? "all_partners" : "all"),
      type: "ADMIN_BROADCAST",
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    snapshot.notifications = [newNotif, ...(snapshot.notifications || [])];
    db.saveSnapshot(snapshot, "notifications");
    return newNotif;
  }

  subscribe(callback) {
    return db.subscribe("notifications", callback);
  }
}

export const notificationManager = new NotificationManager();
