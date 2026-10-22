/**
 * Booking dispatch and concurrency verification.
 * Prevents race conditions where two partners try to accept the same booking.
 */
async function atomicAssignPartner(db, bookingId, partnerId, partnerName) {
  const bookingRef = db.collection("bookings").doc(bookingId);

  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(bookingRef);
    if (!doc.exists) {
      throw new Error("Booking does not exist.");
    }
    const data = doc.data();
    if (data.partnerId && data.partnerId !== partnerId) {
      throw new Error("This booking has already been accepted by another partner.");
    }

    transaction.update(bookingRef, {
      partnerId,
      partnerName,
      partnerAssignmentStatus: "ASSIGNED",
      bookingStatus: "PARTNER_ACCEPTED",
      updatedAt: new Date().toISOString()
    });

    return { success: true, bookingId, partnerId };
  });
}

module.exports = {
  atomicAssignPartner
};
