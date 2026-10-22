/**
 * In-App and Cloud Messaging Notification Sender
 */
async function sendInAppNotification(db, { userId, type, title, message, bookingId = null }) {
  const notifRef = db.collection("notifications").doc();
  const notifData = {
    notificationId: notifRef.id,
    userId,
    type,
    title,
    message,
    bookingId,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  await notifRef.set(notifData);
  return notifData;
}

module.exports = {
  sendInAppNotification
};
