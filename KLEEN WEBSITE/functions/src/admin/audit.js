/**
 * Administrative Audit Logging
 */
async function logAdminAction(db, { adminId, action, targetType, targetId, description }) {
  const logRef = db.collection("adminLogs").doc();
  const logEntry = {
    logId: logRef.id,
    adminId,
    action,
    targetType,
    targetId,
    description,
    timestamp: new Date().toISOString()
  };

  await logRef.set(logEntry);
  return logEntry;
}

module.exports = {
  logAdminAction
};
