/**
 * KLEEN — Unified Database & Realtime Service
 * 
 * Provides reactive Firestore-compatible operations with instantaneous real-time
 * event subscriptions across Customer, Partner, and Admin roles.
 */

import { SEED_CATEGORIES, SEED_SERVICES, SEED_USERS, SEED_BOOKINGS, SEED_OFFERS, SEED_SETTINGS } from "../config/seed-data.js";
import { firebaseClient } from "./firebase/firebase-client.js";

class DatabaseService {
  constructor() {
    this.storageKey = "kleen_firestore_db_v2";
    this.listeners = new Map(); // collectionName -> Set of callback functions
    this.initDatabase();
    this.initFirestoreSync();

    // Broadcast channel for multi-tab cross-synchronization
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === this.storageKey) {
          this.notifyAllListeners();
        }
      });
    }
  }

  async initFirestoreSync() {
    if (firebaseClient.isLive) {
      const collectionsToSync = ["bookings", "users", "partners", "services", "reviews", "complaints", "notifications"];
      collectionsToSync.forEach(colName => {
        firebaseClient.listenCollection(colName, (items) => {
          if (items && items.length > 0) {
            const snapshot = this.getSnapshot();
            snapshot[colName] = items;
            try {
              localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
              this.notifyListeners(colName);
            } catch (e) {
              console.warn("Storage sync warning:", e);
            }
          }
        });
      });
    }
  }

  /**
   * Initializes local reactive store with seed data if not present.
   */
  initDatabase() {
    try {
      const existing = localStorage.getItem(this.storageKey);
      if (!existing) {
        const initialData = {
          categories: SEED_CATEGORIES,
          services: SEED_SERVICES,
          users: [
            SEED_USERS.admin,
            SEED_USERS.partner
          ],
          partners: [
            SEED_USERS.partner
          ],
          bookings: [...SEED_BOOKINGS],
          offers: SEED_OFFERS,
          settings: SEED_SETTINGS,
          complaints: [],
          reviews: [],
          notifications: [],
          partnerAvailability: [],
          partnerEarnings: [],
          partnerKyc: [
            {
              partnerId: "usr_partner_sunita",
              userId: "usr_partner_sunita",
              status: "UNDER_REVIEW",
              dateOfBirth: "1994-05-12",
              gender: "Female",
              address: "TC 14/850, Kowdiar Main Road, Thiruvananthapuram, Kerala - 695003",
              district: "Thiruvananthapuram",
              submittedAt: "2026-09-15T09:30:00.000Z",
              identityDocument: {
                fileName: "Sunita_Aadhaar_ID.jpg",
                fileUrl: "https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&w=800&q=80",
                uploadedAt: "2026-09-15T09:20:00.000Z"
              },
              addressDocument: {
                fileName: "Sunita_Address_Proof.jpg",
                fileUrl: "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=800&q=80",
                uploadedAt: "2026-09-15T09:25:00.000Z"
              },
              profilePhoto: {
                fileName: "Sunita_Profile_Photo.jpg",
                fileUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
                uploadedAt: "2026-09-15T09:28:00.000Z"
              },
              updatedAt: "2026-09-15T09:30:00.000Z"
            }
          ],
          adminLogs: [
            {
              logId: "log_init",
              adminId: "usr_admin_kleen",
              action: "SYSTEM_INITIALIZED",
              targetType: "PLATFORM",
              targetId: "GLOBAL",
              description: "KLEEN Platform initialized with clean catalog.",
              timestamp: new Date().toISOString()
            }
          ]
        };
        localStorage.setItem(this.storageKey, JSON.stringify(initialData));
      }
    } catch (err) {
      console.warn("LocalStorage initialization warning:", err);
    }
  }

  /**
   * Reads raw store snapshot.
   */
  getSnapshot() {
    try {
      const data = localStorage.getItem(this.storageKey);
      const snapshot = data ? JSON.parse(data) : {};
      if (snapshot && !snapshot.seedInitialized && !snapshot.partners?.some(p => p.partnerId === "usr_partner_sunita" || p.email === "partner@kleen.in") && !(snapshot.deletedPartnerIds || []).includes("usr_partner_sunita")) {
        snapshot.partners = [SEED_USERS.partner, ...(snapshot.partners || [])];
        if (!snapshot.users?.some(u => u.email === "partner@kleen.in") && !(snapshot.deletedUserIds || []).includes(SEED_USERS.partner.userId)) {
          snapshot.users = [SEED_USERS.partner, ...(snapshot.users || [])];
        }
        // Ensure seed KYC record exists
        if (!snapshot.partnerKyc?.some(k => k.partnerId === "usr_partner_sunita")) {
          snapshot.partnerKyc = [
            {
              partnerId: "usr_partner_sunita",
              userId: "usr_partner_sunita",
              status: "UNDER_REVIEW",
              dateOfBirth: "1994-05-12",
              gender: "Female",
              address: "TC 14/850, Kowdiar Main Road, Thiruvananthapuram, Kerala - 695003",
              district: "Thiruvananthapuram",
              submittedAt: "2026-09-15T09:30:00.000Z",
              identityDocument: {
                fileName: "Sunita_Aadhaar_ID.jpg",
                fileUrl: "https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&w=800&q=80",
                uploadedAt: "2026-09-15T09:20:00.000Z"
              },
              addressDocument: {
                fileName: "Sunita_Address_Proof.jpg",
                fileUrl: "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=800&q=80",
                uploadedAt: "2026-09-15T09:25:00.000Z"
              },
              profilePhoto: {
                fileName: "Sunita_Profile_Photo.jpg",
                fileUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
                uploadedAt: "2026-09-15T09:28:00.000Z"
              },
              updatedAt: "2026-09-15T09:30:00.000Z"
            },
            ...(snapshot.partnerKyc || [])
          ];
        }
        snapshot.seedInitialized = true;
      }

      if (snapshot) {
        snapshot.payouts = snapshot.payouts || [];
        if (snapshot.partners) {
          snapshot.partners = snapshot.partners.map(p => {
            if ((p.partnerId === "usr_partner_sunita" || p.userId === "usr_partner_sunita") && (!p.bankDetails || !p.bankDetails.accountNumber)) {
              return { ...p, bankDetails: SEED_USERS.partner.bankDetails };
            }
            return p;
          });
        }
      }

      // Schema Versioning & Safe Migration:
      // Ensure seed services & categories are initialized, but NEVER delete admin-added custom services or categories.
      if (!snapshot.categories || snapshot.categories.length === 0) {
        snapshot.categories = SEED_CATEGORIES;
      }
      if (!snapshot.services || snapshot.services.length === 0) {
        snapshot.services = SEED_SERVICES;
      }

      // Check if on legacy schema (has old deleted categories like 'cat_deep_cleaning')
      const legacyCategoryIds = new Set(["cat_deep_cleaning", "cat_sofa_cleaning"]);
      const hasLegacySchema = (snapshot.categories || []).some(c => legacyCategoryIds.has(c.categoryId));

      if (hasLegacySchema || !snapshot.catalogVersion || snapshot.catalogVersion < 2) {
        const storedCats = snapshot.categories || [];
        const storedSrvs = snapshot.services || [];

        // Preserve any custom services/categories added by admin
        const customCategories = storedCats.filter(c => c.isCustom || (!legacyCategoryIds.has(c.categoryId) && !SEED_CATEGORIES.some(sc => sc.categoryId === c.categoryId)));
        const customServices = storedSrvs.filter(s => s.isCustom || !SEED_SERVICES.some(sc => sc.serviceId === s.serviceId));

        const mergedCategories = [...SEED_CATEGORIES];
        customCategories.forEach(cc => {
          if (!mergedCategories.some(c => c.categoryId === cc.categoryId)) {
            mergedCategories.push(cc);
          }
        });

        const mergedServices = [...SEED_SERVICES];
        customServices.forEach(cs => {
          if (!mergedServices.some(s => s.serviceId === cs.serviceId)) {
            mergedServices.push(cs);
          }
        });

        snapshot.categories = mergedCategories;
        snapshot.services = mergedServices;
        snapshot.catalogVersion = 2;
        try { localStorage.setItem(this.storageKey, JSON.stringify(snapshot)); } catch (e) {}
      }

      // Ensure Bathroom Deep Cleaning uses verified 200 OK image
      const deepBathroom = (snapshot.services || []).find(s => s.serviceId === "srv_bathroom_deep");
      if (deepBathroom && (!deepBathroom.image || deepBathroom.image.includes("1620626011761"))) {
        deepBathroom.image = "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80";
        try { localStorage.setItem(this.storageKey, JSON.stringify(snapshot)); } catch (e) {}
      }

      // Clean up any old marketplace gigs if present
      if (snapshot.bookings && snapshot.bookings.some(b => b.bookingId && b.bookingId.startsWith("gig_90214"))) {
        snapshot.bookings = snapshot.bookings.filter(b => !b.bookingId || !b.bookingId.startsWith("gig_90214"));
        try { localStorage.setItem(this.storageKey, JSON.stringify(snapshot)); } catch (e) {}
      }

      // Ensure verified fleet partners exist for demo and realistic dispatch
      if (!snapshot.partners || snapshot.partners.length <= 1) {
        const extraPartners = [
          {
            userId: "usr_partner_anjali",
            partnerId: "usr_partner_anjali",
            role: "partner",
            fullName: "Anjali Nair",
            email: "anjali.partner@kleen.in",
            phone: "+91 94471 22334",
            profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
            city: "Kochi",
            district: "Ernakulam",
            state: "Kerala",
            address: "Flat 4B, Skyline Riverdale, Marine Drive, Kochi - 682031",
            accountStatus: "ACTIVE",
            kycStatus: "APPROVED",
            isEligibleForBooking: true,
            isOnline: true,
            rating: 4.95,
            totalRatings: 56,
            totalCompletedJobs: 64,
            totalEarnings: 48200,
            createdAt: "2026-01-15T09:00:00.000Z"
          },
          {
            userId: "usr_partner_priya",
            partnerId: "usr_partner_priya",
            role: "partner",
            fullName: "Priya Menon",
            email: "priya.partner@kleen.in",
            phone: "+91 98460 55667",
            profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
            city: "Kozhikode",
            district: "Kozhikode",
            state: "Kerala",
            address: "No. 28, Cyberpark Avenue, Palazhi, Kozhikode - 673014",
            accountStatus: "ACTIVE",
            kycStatus: "APPROVED",
            isEligibleForBooking: true,
            isOnline: true,
            rating: 4.88,
            totalRatings: 32,
            totalCompletedJobs: 38,
            totalEarnings: 28900,
            createdAt: "2026-02-01T10:00:00.000Z"
          },
          {
            userId: "usr_partner_lakshmi",
            partnerId: "usr_partner_lakshmi",
            role: "partner",
            fullName: "Lakshmi Devi",
            email: "lakshmi.partner@kleen.in",
            phone: "+91 97455 88990",
            profileImage: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=300&q=80",
            city: "Thrissur",
            district: "Thrissur",
            state: "Kerala",
            address: "House 12, Swaraj Round West, Thrissur - 680001",
            accountStatus: "ACTIVE",
            kycStatus: "APPROVED",
            isEligibleForBooking: true,
            isOnline: false,
            rating: 4.92,
            totalRatings: 44,
            totalCompletedJobs: 52,
            totalEarnings: 36400,
            createdAt: "2026-02-10T11:00:00.000Z"
          }
        ];

        const existingPartnerIds = new Set((snapshot.partners || []).map(p => p.partnerId || p.userId));
        const toAdd = extraPartners.filter(p => !existingPartnerIds.has(p.partnerId));
        if (toAdd.length > 0) {
          snapshot.partners = [...(snapshot.partners || []), ...toAdd];
          try { localStorage.setItem(this.storageKey, JSON.stringify(snapshot)); } catch (e) {}
        }
      }

      // Ensure Sunita Verma is approved and online for demonstration if still under review
      const sunita = (snapshot.partners || []).find(p => p.partnerId === "usr_partner_sunita");
      if (sunita && sunita.kycStatus === "UNDER_REVIEW") {
        sunita.kycStatus = "APPROVED";
        sunita.isEligibleForBooking = true;
        sunita.isOnline = true;
        try { localStorage.setItem(this.storageKey, JSON.stringify(snapshot)); } catch (e) {}
      }

      // Ensure sample booked gig shifts exist
      if (!snapshot.partnerGigSlots || snapshot.partnerGigSlots.length === 0) {
        const dateRange = this.getPartnerAllowedDateRange();
        const d0 = dateRange[0]?.iso;
        const d1 = dateRange[1]?.iso;
        const d2 = dateRange[2]?.iso;

        snapshot.partnerGigSlots = [
          {
            slotId: "gig_slot_seed_1",
            partnerId: "usr_partner_anjali",
            date: d0,
            timeSlot: "08:00 AM – 12:00 PM",
            startTime: "08:00",
            endTime: "12:00",
            slotTitle: "Morning Gig Shift",
            status: "BOOKED",
            createdAt: new Date().toISOString()
          },
          {
            slotId: "gig_slot_seed_2",
            partnerId: "usr_partner_sunita",
            date: d0,
            timeSlot: "11:00 AM – 03:00 PM",
            startTime: "11:00",
            endTime: "15:00",
            slotTitle: "Midday Gig Shift",
            status: "BOOKED",
            createdAt: new Date().toISOString()
          },
          {
            slotId: "gig_slot_seed_3",
            partnerId: "usr_partner_priya",
            date: d0,
            timeSlot: "02:00 PM – 06:00 PM",
            startTime: "14:00",
            endTime: "18:00",
            slotTitle: "Afternoon Gig Shift",
            status: "BOOKED",
            createdAt: new Date().toISOString()
          },
          {
            slotId: "gig_slot_seed_4",
            partnerId: "usr_partner_sunita",
            date: d1,
            timeSlot: "08:00 AM – 12:00 PM",
            startTime: "08:00",
            endTime: "12:00",
            slotTitle: "Morning Gig Shift",
            status: "BOOKED",
            createdAt: new Date().toISOString()
          },
          {
            slotId: "gig_slot_seed_5",
            partnerId: "usr_partner_anjali",
            date: d1,
            timeSlot: "05:00 PM – 09:00 PM",
            startTime: "17:00",
            endTime: "21:00",
            slotTitle: "Evening Gig Shift",
            status: "BOOKED",
            createdAt: new Date().toISOString()
          },
          {
            slotId: "gig_slot_seed_6",
            partnerId: "usr_partner_lakshmi",
            date: d1,
            timeSlot: "02:00 PM – 06:00 PM",
            startTime: "14:00",
            endTime: "18:00",
            slotTitle: "Afternoon Gig Shift",
            status: "BOOKED",
            createdAt: new Date().toISOString()
          },
          {
            slotId: "gig_slot_seed_7",
            partnerId: "usr_partner_priya",
            date: d2,
            timeSlot: "11:00 AM – 03:00 PM",
            startTime: "11:00",
            endTime: "15:00",
            slotTitle: "Midday Gig Shift",
            status: "BOOKED",
            createdAt: new Date().toISOString()
          }
        ];
        try { localStorage.setItem(this.storageKey, JSON.stringify(snapshot)); } catch (e) {}
      }

      // Ensure sample customer bookings exist
      if (!snapshot.bookings || snapshot.bookings.length === 0) {
        const dateRange = this.getPartnerAllowedDateRange();
        const d0 = dateRange[0]?.iso;
        const d1 = dateRange[1]?.iso;

        snapshot.bookings = [
          {
            bookingId: "bk_70192",
            customerId: "usr_cust_rahul",
            customerName: "Rahul George",
            customerPhone: "+91 98470 11223",
            serviceId: "srv_hourly_4hr",
            serviceName: "Hourly Maid Help — 4 Hours",
            partnerId: "usr_partner_anjali",
            partnerName: "Anjali Nair",
            partnerPhone: "+91 94471 22334",
            bookingDate: d0,
            startTime: "08:30 AM",
            totalAmount: 749,
            paymentStatus: "SUCCESS",
            bookingStatus: "SERVICE_IN_PROGRESS",
            address: "House 14, Panampilly Nagar, Kochi, Kerala - 682036",
            createdAt: new Date().toISOString()
          },
          {
            bookingId: "bk_70204",
            customerId: "usr_cust_sneha",
            customerName: "Sneha Pillai",
            customerPhone: "+91 97440 22334",
            serviceId: "srv_kitchen_deep",
            serviceName: "Kitchen Deep Sanitization",
            partnerId: "usr_partner_sunita",
            partnerName: "Sunita Verma",
            partnerPhone: "+91 98765 43210",
            bookingDate: d0,
            startTime: "11:30 AM",
            totalAmount: 649,
            paymentStatus: "SUCCESS",
            bookingStatus: "CONFIRMED",
            address: "TC 12/402, Kowdiar, Thiruvananthapuram - 695003",
            createdAt: new Date().toISOString()
          },
          {
            bookingId: "bk_70218",
            customerId: "usr_cust_arun",
            customerName: "Dr. Arun Kumar",
            customerPhone: "+91 94460 33445",
            serviceId: "srv_bathroom_deep",
            serviceName: "Bathroom Tile Scrubbing",
            partnerId: "usr_partner_priya",
            partnerName: "Priya Menon",
            partnerPhone: "+91 98460 55667",
            bookingDate: d0,
            startTime: "02:30 PM",
            totalAmount: 499,
            paymentStatus: "SUCCESS",
            bookingStatus: "CONFIRMED",
            address: "Flat 3C, Hilite Residency, Palazhi, Kozhikode - 673014",
            createdAt: new Date().toISOString()
          },
          {
            bookingId: "bk_70225",
            customerId: "usr_cust_meera",
            customerName: "Meera Nambiar",
            customerPhone: "+91 99950 44556",
            serviceId: "srv_hourly_2hr",
            serviceName: "Express Maid Assistance — 2 Hours",
            partnerId: null,
            partnerName: null,
            bookingDate: d0,
            startTime: "04:30 PM",
            totalAmount: 399,
            paymentStatus: "SUCCESS",
            bookingStatus: "PENDING_DISPATCH",
            address: "No. 8, Kakkanad Infopark Road, Kochi - 682030",
            createdAt: new Date().toISOString()
          }
        ];
        try { localStorage.setItem(this.storageKey, JSON.stringify(snapshot)); } catch (e) {}
      }

      // Ensure customer has completed previous bookings for history display
      if (snapshot.bookings && !snapshot.bookings.some(b => b.bookingId === "bk_70180")) {
        snapshot.bookings.push({
          bookingId: "bk_70180",
          customerId: "usr_cust_rahul",
          customerName: "Rahul George",
          customerPhone: "+91 98470 11223",
          serviceId: "srv_bathroom_deep",
          serviceName: "Bathroom Tile Scrubbing",
          serviceImage: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=120&q=80",
          partnerId: "usr_partner_sunita",
          partnerName: "Sunita Verma",
          partnerPhone: "+91 98765 43210",
          partnerImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
          bookingDate: "2026-09-12",
          startTime: "10:00 AM",
          totalAmount: 499,
          paymentStatus: "SUCCESS",
          bookingStatus: "SERVICE_COMPLETED",
          address: "House 14, Panampilly Nagar, Kochi, Kerala - 682036",
          completedAt: "2026-09-12T12:00:00.000Z",
          createdAt: "2026-09-12T09:00:00.000Z"
        });
        snapshot.bookings.push({
          bookingId: "bk_70165",
          customerId: "usr_cust_rahul",
          customerName: "Rahul George",
          customerPhone: "+91 98470 11223",
          serviceId: "srv_kitchen_deep",
          serviceName: "Kitchen Deep Sanitization",
          serviceImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=120&q=80",
          partnerId: "usr_partner_anjali",
          partnerName: "Anjali Nair",
          partnerPhone: "+91 94471 22334",
          partnerImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
          bookingDate: "2026-09-05",
          startTime: "02:00 PM",
          totalAmount: 649,
          paymentStatus: "SUCCESS",
          bookingStatus: "SERVICE_COMPLETED",
          address: "House 14, Panampilly Nagar, Kochi, Kerala - 682036",
          completedAt: "2026-09-05T15:30:00.000Z",
          createdAt: "2026-09-05T13:00:00.000Z"
        });
        try { localStorage.setItem(this.storageKey, JSON.stringify(snapshot)); } catch (e) {}
      }

      if (!snapshot.partnerGigSlots) {
        snapshot.partnerGigSlots = [];
      }

      return snapshot;

    } catch (err) {
      console.error("Error reading db snapshot:", err);
      return {};
    }
  }

  /**
   * Commits updated database, syncs to Cloud Firestore if live, and triggers subscribers.
   */
  saveSnapshot(data, collectionModified = null, docIdModified = null, docDataModified = null) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.notifyListeners(collectionModified);

      // Auto-sync modified collection items to live Cloud Firestore
      if (firebaseClient.isLive && collectionModified) {
        if (docIdModified && docDataModified) {
          firebaseClient.saveDoc(collectionModified, docIdModified, docDataModified);
        } else if (Array.isArray(data[collectionModified])) {
          // Sync items in collection
          data[collectionModified].forEach(item => {
            const idKey = item.bookingId || item.userId || item.partnerId || item.serviceId || item.reviewId || item.complaintId || item.notificationId || item.id;
            if (idKey) {
              firebaseClient.saveDoc(collectionModified, idKey, item);
            }
          });
        }
      }
    } catch (err) {
      console.error("Error saving db snapshot:", err);
    }
  }

  // =========================================================================
  // Realtime Subscriptions (matches Firestore onSnapshot signature)
  // =========================================================================
  subscribe(collectionName, callback) {
    if (!this.listeners.has(collectionName)) {
      this.listeners.set(collectionName, new Set());
    }
    this.listeners.get(collectionName).add(callback);

    // Initial trigger with current state
    const snapshot = this.getSnapshot();
    callback(snapshot[collectionName] || []);

    // Return unsubscribe function
    return () => {
      const colListeners = this.listeners.get(collectionName);
      if (colListeners) {
        colListeners.delete(callback);
      }
    };
  }

  notifyListeners(collectionName) {
    const snapshot = this.getSnapshot();
    if (collectionName && this.listeners.has(collectionName)) {
      const data = snapshot[collectionName] || [];
      this.listeners.get(collectionName).forEach(cb => {
        try { cb(data); } catch (e) { console.error("Listener error:", e); }
      });
    } else {
      this.notifyAllListeners();
    }
  }

  notifyAllListeners() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((set, colName) => {
      const data = snapshot[colName] || [];
      set.forEach(cb => {
        try { cb(data); } catch (e) { console.error("Listener error:", e); }
      });
    });
  }

  // =========================================================================
  // Services & Categories
  // =========================================================================
  getCategories() {
    return this.getSnapshot().categories || [];
  }

  getServices(categoryId = null) {
    const services = this.getSnapshot().services || [];
    if (!categoryId || categoryId === "all") return services;
    return services.filter(s => s.categoryId === categoryId);
  }

  getServiceById(serviceId) {
    const services = this.getSnapshot().services || [];
    return services.find(s => s.serviceId === serviceId) || null;
  }

  addService(serviceData) {
    const snapshot = this.getSnapshot();
    const newService = {
      serviceId: serviceData.serviceId || ("srv_" + Date.now()),
      name: serviceData.name || "New Home Service",
      description: serviceData.description || "",
      categoryId: serviceData.categoryId || (snapshot.categories?.[0]?.categoryId || "cat_home_cleaning"),
      price: Number(serviceData.price) || 499,
      duration: serviceData.duration || "2.0 hrs",
      bookingType: serviceData.bookingType || "Fixed",
      image: serviceData.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
      includedTasks: Array.isArray(serviceData.includedTasks) ? serviceData.includedTasks : (serviceData.includedTasks ? serviceData.includedTasks.split("\n").filter(Boolean) : ["Standard domestic home service"]),
      excludedTasks: Array.isArray(serviceData.excludedTasks) ? serviceData.excludedTasks : (serviceData.excludedTasks ? serviceData.excludedTasks.split("\n").filter(Boolean) : ["Exterior height hazardous work"]),
      isActive: serviceData.isActive !== false,
      isCustom: true,
      rating: 5.0,
      reviewCount: 0,
      ...serviceData
    };
    snapshot.services = [newService, ...(snapshot.services || [])];
    this.saveSnapshot(snapshot, "services");
    return newService;
  }

  updateService(serviceId, updates) {
    const snapshot = this.getSnapshot();
    snapshot.services = (snapshot.services || []).map(s => {
      if (s.serviceId === serviceId) {
        return {
          ...s,
          ...updates,
          price: updates.price !== undefined ? Number(updates.price) : s.price
        };
      }
      return s;
    });
    this.saveSnapshot(snapshot, "services");
  }

  deleteService(serviceId) {
    const snapshot = this.getSnapshot();
    snapshot.services = (snapshot.services || []).filter(s => s.serviceId !== serviceId);
    this.saveSnapshot(snapshot, "services");
  }

  addCategory(categoryData) {
    const snapshot = this.getSnapshot();
    const newCategory = {
      categoryId: categoryData.categoryId || ("cat_" + Date.now()),
      name: categoryData.name || "New Category",
      description: categoryData.description || "",
      icon: categoryData.icon || "sparkles",
      image: categoryData.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
      isActive: true,
      isCustom: true,
      sortOrder: Number(categoryData.sortOrder) || ((snapshot.categories || []).length + 1),
      ...categoryData
    };
    snapshot.categories = [...(snapshot.categories || []), newCategory];
    this.saveSnapshot(snapshot, "categories");
    return newCategory;
  }

  updateCategory(categoryId, updates) {
    const snapshot = this.getSnapshot();
    snapshot.categories = (snapshot.categories || []).map(c => {
      if (c.categoryId === categoryId) {
        return { ...c, ...updates };
      }
      return c;
    });
    this.saveSnapshot(snapshot, "categories");
  }

  deleteCategory(categoryId) {
    const snapshot = this.getSnapshot();
    snapshot.categories = (snapshot.categories || []).filter(c => c.categoryId !== categoryId);
    this.saveSnapshot(snapshot, "categories");
  }

  // =========================================================================
  // Bookings & Lifecycle Dispatch
  // =========================================================================
  getBookings() {
    return this.getSnapshot().bookings || [];
  }

  getBookingById(bookingId) {
    return (this.getSnapshot().bookings || []).find(b => b.bookingId === bookingId) || null;
  }

  createBooking(bookingPayload) {
    if (!bookingPayload || !bookingPayload.customerId || bookingPayload.customerId.startsWith("guest_")) {
      throw new Error("Customer authentication is mandatory to create a booking.");
    }

    const snapshot = this.getSnapshot();
    const newBooking = {
      bookingId: "bk_" + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
      paymentStatus: "SUCCESS",
      bookingStatus: "CONFIRMED", // Confirmed post-payment
      partnerId: null,
      partnerName: null,
      ...bookingPayload
    };

    snapshot.bookings = [newBooking, ...(snapshot.bookings || [])];

    // Create confirmation notification
    const newNotif = {
      notificationId: "notif_" + Date.now(),
      userId: newBooking.customerId,
      type: "BOOKING_CONFIRMED",
      title: "Booking Confirmed",
      message: `Your booking for ${newBooking.serviceName} on ${newBooking.bookingDate} at ${newBooking.startTime} has been received.`,
      bookingId: newBooking.bookingId,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    snapshot.notifications = [newNotif, ...(snapshot.notifications || [])];

    this.saveSnapshot(snapshot, "bookings");
    return newBooking;
  }

  updateBookingStatus(bookingId, newStatus, extraData = {}) {
    const snapshot = this.getSnapshot();
    let updatedBooking = null;

    snapshot.bookings = (snapshot.bookings || []).map(b => {
      if (b.bookingId === bookingId) {
        updatedBooking = {
          ...b,
          status: newStatus,
          bookingStatus: newStatus,
          updatedAt: new Date().toISOString(),
          ...extraData
        };

        // If completed, record completedAt and credit partner earnings
        if (newStatus === "SERVICE_COMPLETED") {
          updatedBooking.completedAt = new Date().toISOString();
        }
        return updatedBooking;
      }
      return b;
    });

    // If completed and partner assigned, update partner total jobs and earnings
    if (newStatus === "SERVICE_COMPLETED" && updatedBooking && updatedBooking.partnerId) {
      const gross = updatedBooking.totalAmount || 500;
      const partnerEarnings = Math.round(gross * 0.8); // 80% to partner
      snapshot.partners = (snapshot.partners || []).map(p => {
        if (p.partnerId === updatedBooking.partnerId || p.userId === updatedBooking.partnerId) {
          return {
            ...p,
            totalCompletedJobs: (p.totalCompletedJobs || 0) + 1,
            totalEarnings: (p.totalEarnings || 0) + partnerEarnings
          };
        }
        return p;
      });
    }

    this.saveSnapshot(snapshot, "bookings");
    return updatedBooking;
  }

  assignPartnerToBooking(bookingId, partnerId, partnerName) {
    return this.acceptBookingAtomically(bookingId, partnerId, partnerName);
  }

  // =========================================================================
  // Audit Logging (PRD Section 51)
  // =========================================================================
  logAuditAction({ actorId, actorRole = "partner", action, targetId = "", metadata = {}, description = "" }) {
    const snapshot = this.getSnapshot();
    const logEntry = {
      logId: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      actorId,
      actorRole,
      action,
      targetId,
      metadata,
      description: description || `Action ${action} by ${actorRole} ${actorId}`,
      timestamp: new Date().toISOString()
    };
    snapshot.adminLogs = [logEntry, ...(snapshot.adminLogs || [])];
    this.saveSnapshot(snapshot, "adminLogs");
    return logEntry;
  }

  // =========================================================================
  // Atomic Partner Booking Acceptance & Lifecycle Actions
  // =========================================================================
  acceptBookingAtomically(bookingId, partnerId, partnerName) {
    const snapshot = this.getSnapshot();
    const booking = (snapshot.bookings || []).find(b => b.bookingId === bookingId);
    if (!booking) {
      throw new Error("Booking not found.");
    }
    if (booking.status === "CANCELLED" || booking.bookingStatus === "CUSTOMER_CANCELLED" || booking.bookingStatus === "PARTNER_CANCELLED") {
      throw new Error("This booking has been cancelled.");
    }
    if (booking.partnerId && booking.partnerId !== partnerId) {
      throw new Error("This booking has already been assigned to another partner.");
    }
    if (booking.status === "COMPLETED" || booking.status === "SERVICE_COMPLETED") {
      throw new Error("This booking has already been completed.");
    }

    // Verify partner is eligible and active
    const partner = (snapshot.partners || []).find(p => p.partnerId === partnerId || p.userId === partnerId);
    if (partner) {
      if (partner.accountStatus !== "ACTIVE") {
        throw new Error("Cannot accept booking: Partner account is not active.");
      }
      if (partner.kycStatus !== "APPROVED") {
        throw new Error("Cannot accept booking: Partner KYC is not approved.");
      }
      if (!partner.isOnline) {
        throw new Error("Cannot accept booking: Partner is currently offline.");
      }
    }

    // In Gigs model, allow flexible claiming of gigs. Only prevent if an active service is currently in progress.
    const activeServiceInProgress = (snapshot.bookings || []).find(b => 
      b.partnerId === partnerId && 
      b.bookingId !== bookingId &&
      ["SERVICE_STARTED"].includes(b.status)
    );
    if (activeServiceInProgress) {
      throw new Error(`You currently have an active job (#${activeServiceInProgress.bookingId}) in progress. Please complete it before starting another.`);
    }

    const updated = this.updateBookingStatus(bookingId, "PARTNER_ACCEPTED", {
      partnerId,
      partnerName,
      partnerAssignmentStatus: "ACCEPTED",
      acceptedAt: new Date().toISOString()
    });

    // Notify customer
    snapshot.notifications = [
      {
        notificationId: "notif_" + Date.now(),
        userId: booking.customerId,
        type: "PARTNER_ASSIGNED",
        title: "Partner Assigned",
        message: `${partnerName} has accepted your service booking #${bookingId}.`,
        isRead: false,
        createdAt: new Date().toISOString()
      },
      ...(snapshot.notifications || [])
    ];
    this.saveSnapshot(snapshot, "notifications");

    // Audit log
    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "BOOKING_ACCEPTED",
      targetId: bookingId,
      description: `Partner ${partnerName} (${partnerId}) accepted booking #${bookingId}`
    });

    return updated;
  }

  rejectBookingByPartner(bookingId, partnerId, reason = "Not available") {
    const snapshot = this.getSnapshot();
    const booking = (snapshot.bookings || []).find(b => b.bookingId === bookingId);
    if (!booking) return;

    // Reset partner assignment so other eligible partners can accept it
    const updated = this.updateBookingStatus(bookingId, "SEARCHING_PARTNER", {
      partnerId: null,
      partnerName: null,
      partnerAssignmentStatus: "SEARCHING",
      lastRejectionReason: reason,
      lastRejectedAt: new Date().toISOString()
    });

    // Audit log
    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "BOOKING_REJECTED",
      targetId: bookingId,
      metadata: { reason },
      description: `Partner ${partnerId} rejected booking #${bookingId}: ${reason}`
    });

    return updated;
  }

  cancelBookingByPartner(bookingId, partnerId, reason) {
    if (!reason || !reason.trim()) {
      throw new Error("A cancellation reason is required.");
    }
    const snapshot = this.getSnapshot();
    const booking = (snapshot.bookings || []).find(b => b.bookingId === bookingId);
    if (!booking) {
      throw new Error("Booking not found.");
    }
    if (booking.partnerId !== partnerId) {
      throw new Error("Unauthorized: You are not assigned to this booking.");
    }
    if (booking.status === "SERVICE_STARTED" || booking.status === "SERVICE_COMPLETED" || booking.status === "COMPLETED") {
      throw new Error("Cannot cancel booking once service has started or completed.");
    }

    const nowIso = new Date().toISOString();
    const updated = this.updateBookingStatus(bookingId, "PARTNER_CANCELLED", {
      partnerId: null,
      partnerName: null,
      partnerAssignmentStatus: "CANCELLED_BY_PARTNER",
      cancellationReason: reason,
      cancelledAt: nowIso
    });

    // Notify customer and admin
    snapshot.notifications = [
      {
        notificationId: "notif_" + Date.now(),
        userId: booking.customerId,
        type: "BOOKING_CANCELLED",
        title: "Booking Re-routed",
        message: `Your service partner had to cancel due to: "${reason}". We are re-assigning another verified partner.`,
        isRead: false,
        createdAt: nowIso
      },
      {
        notificationId: "notif_" + (Date.now() + 1),
        userId: "usr_admin_kleen",
        type: "PARTNER_CANCELLATION",
        title: "Partner Cancelled Booking",
        message: `Partner ${partnerId} cancelled booking #${bookingId}. Reason: ${reason}`,
        isRead: false,
        createdAt: nowIso
      },
      ...(snapshot.notifications || [])
    ];
    this.saveSnapshot(snapshot, "notifications");

    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "PARTNER_CANCELLATION",
      targetId: bookingId,
      metadata: { reason },
      description: `Partner ${partnerId} cancelled booking #${bookingId}. Reason: ${reason}`
    });

    return updated;
  }

  // =========================================================================
  // Gigs — Partner Time Slot Booking System (Up to 3 Days Window)
  // =========================================================================
  getPartnerAllowedDateRange() {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = i === 0 ? "Today" : (i === 1 ? "Tomorrow" : `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`);
      dates.push({
        iso,
        label,
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        month: monthNames[d.getMonth()],
        index: i
      });
    }
    return dates;
  }

  getPartnerGigSlots(partnerId, dateFilter = null) {
    const snapshot = this.getSnapshot();
    let slots = (snapshot.partnerGigSlots || []).filter(s => s.partnerId === partnerId && s.status !== "CANCELLED");
    if (dateFilter) {
      slots = slots.filter(s => s.date === dateFilter);
    }
    return slots.sort((a, b) => (a.date + (a.startTime || "")).localeCompare(b.date + (b.startTime || "")));
  }

  bookPartnerGigSlot(partnerId, { date, timeSlot, startTime, endTime, slotTitle = "General Maid & Cleaning Gig" }) {
    if (!partnerId || !date || !timeSlot) {
      throw new Error("Partner ID, Date, and Time Slot are required.");
    }

    // Strict validation: Only up to 3 days from current date
    const allowedDates = this.getPartnerAllowedDateRange();
    const isAllowed = allowedDates.some(d => d.iso === date);
    if (!isAllowed) {
      throw new Error("Invalid date: Gigs can only be booked up to 3 days from today.");
    }

    const snapshot = this.getSnapshot();
    if (!snapshot.partnerGigSlots) snapshot.partnerGigSlots = [];

    // Check if slot already booked for this partner on this date and time
    const existing = snapshot.partnerGigSlots.find(s => 
      s.partnerId === partnerId && 
      s.date === date && 
      s.timeSlot === timeSlot && 
      s.status !== "CANCELLED"
    );
    if (existing) {
      throw new Error(`You have already booked the ${timeSlot} slot for ${date}.`);
    }

    const newSlot = {
      slotId: "gig_slot_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      partnerId,
      date,
      timeSlot,
      startTime: startTime || timeSlot.split("–")[0]?.trim() || "09:00",
      endTime: endTime || timeSlot.split("–")[1]?.trim() || "13:00",
      slotTitle,
      status: "BOOKED",
      createdAt: new Date().toISOString()
    };

    snapshot.partnerGigSlots.push(newSlot);
    this.saveSnapshot(snapshot, "partnerGigSlots");

    // Audit log
    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "GIG_SLOT_BOOKED",
      targetId: newSlot.slotId,
      metadata: { date, timeSlot },
      description: `Partner booked gig time slot ${timeSlot} on ${date}`
    });

    return newSlot;
  }

  getAllPartnerGigSlots(dateFilter = null) {
    const snapshot = this.getSnapshot();
    let slots = (snapshot.partnerGigSlots || []).filter(s => s.status !== "CANCELLED");
    if (dateFilter) {
      slots = slots.filter(s => s.date === dateFilter);
    }
    return slots.sort((a, b) => (a.date + (a.startTime || "")).localeCompare(b.date + (b.startTime || "")));
  }

  cancelPartnerGigSlot(slotId, partnerId = null) {
    const snapshot = this.getSnapshot();
    let cancelledSlot = null;
    snapshot.partnerGigSlots = (snapshot.partnerGigSlots || []).map(s => {
      if (s.slotId === slotId && (!partnerId || s.partnerId === partnerId)) {
        cancelledSlot = { ...s, status: "CANCELLED", cancelledAt: new Date().toISOString() };
        return cancelledSlot;
      }
      return s;
    });

    if (!cancelledSlot) {
      throw new Error("Gig slot not found or unauthorized.");
    }

    this.saveSnapshot(snapshot, "partnerGigSlots");

    this.logAuditAction({
      actorId: partnerId || "usr_admin_kleen",
      actorRole: partnerId ? "partner" : "admin",
      action: "GIG_SLOT_CANCELLED",
      targetId: slotId,
      description: `Gig time slot ${cancelledSlot.timeSlot} on ${cancelledSlot.date} cancelled by ${partnerId ? 'partner' : 'admin'}`
    });

    return cancelledSlot;
  }

  startTrip(bookingId, partnerId) {
    const nowIso = new Date().toISOString();
    const updated = this.updateBookingStatus(bookingId, "ON_THE_WAY", {
      tripStartedAt: nowIso
    });

    const snapshot = this.getSnapshot();
    const booking = (snapshot.bookings || []).find(b => b.bookingId === bookingId);
    if (booking) {
      snapshot.notifications = [
        {
          notificationId: "notif_" + Date.now(),
          userId: booking.customerId,
          type: "PARTNER_ON_THE_WAY",
          title: "Partner On The Way",
          message: `${booking.partnerName || 'Your service partner'} is on the way to your location.`,
          isRead: false,
          createdAt: nowIso
        },
        ...(snapshot.notifications || [])
      ];
      this.saveSnapshot(snapshot, "notifications");
    }

    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "TRIP_STARTED",
      targetId: bookingId,
      description: `Partner started trip for booking #${bookingId}`
    });

    return updated;
  }

  markArrived(bookingId, partnerId) {
    const nowIso = new Date().toISOString();
    const updated = this.updateBookingStatus(bookingId, "ARRIVED", {
      arrivedAt: nowIso
    });

    const snapshot = this.getSnapshot();
    const booking = (snapshot.bookings || []).find(b => b.bookingId === bookingId);
    if (booking) {
      snapshot.notifications = [
        {
          notificationId: "notif_" + Date.now(),
          userId: booking.customerId,
          type: "PARTNER_ARRIVED",
          title: "Partner Arrived",
          message: `${booking.partnerName || 'Your service partner'} has arrived at your address.`,
          isRead: false,
          createdAt: nowIso
        },
        ...(snapshot.notifications || [])
      ];
      this.saveSnapshot(snapshot, "notifications");
    }

    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "PARTNER_ARRIVED",
      targetId: bookingId,
      description: `Partner arrived at service location for booking #${bookingId}`
    });

    return updated;
  }

  startService(bookingId, partnerId) {
    const nowIso = new Date().toISOString();
    const updated = this.updateBookingStatus(bookingId, "SERVICE_STARTED", {
      serviceStartedAt: nowIso
    });

    const snapshot = this.getSnapshot();
    const booking = (snapshot.bookings || []).find(b => b.bookingId === bookingId);
    if (booking) {
      snapshot.notifications = [
        {
          notificationId: "notif_" + Date.now(),
          userId: booking.customerId,
          type: "SERVICE_STARTED",
          title: "Service Started",
          message: `Cleaning service for booking #${bookingId} is in progress.`,
          isRead: false,
          createdAt: nowIso
        },
        ...(snapshot.notifications || [])
      ];
      this.saveSnapshot(snapshot, "notifications");
    }

    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "SERVICE_STARTED",
      targetId: bookingId,
      description: `Partner started cleaning service for booking #${bookingId}`
    });

    return updated;
  }

  completeService(bookingId, partnerId) {
    const nowIso = new Date().toISOString();
    const snapshot = this.getSnapshot();
    const booking = (snapshot.bookings || []).find(b => b.bookingId === bookingId);
    if (!booking) throw new Error("Booking not found.");

    const gross = booking.totalAmount || 499;
    const platformCommission = Math.round(gross * 0.20); // 20% platform commission
    const partnerAmount = gross - platformCommission; // 80% partner payout

    // Create itemized earnings record
    const newEarning = {
      earningId: "earn_" + Date.now(),
      partnerId,
      bookingId,
      serviceName: booking.serviceName,
      customerName: booking.customerName,
      bookingDate: booking.bookingDate,
      grossAmount: gross,
      platformCommission,
      partnerAmount,
      settlementStatus: "PENDING",
      createdAt: nowIso,
      updatedAt: nowIso
    };
    snapshot.partnerEarnings = [newEarning, ...(snapshot.partnerEarnings || [])];

    // Update partner record stats
    snapshot.partners = (snapshot.partners || []).map(p => {
      if (p.partnerId === partnerId || p.userId === partnerId) {
        return {
          ...p,
          totalCompletedJobs: (p.totalCompletedJobs || 0) + 1,
          totalEarnings: (p.totalEarnings || 0) + partnerAmount
        };
      }
      return p;
    });

    // Update booking status
    snapshot.bookings = (snapshot.bookings || []).map(b => {
      if (b.bookingId === bookingId) {
        return {
          ...b,
          status: "SERVICE_COMPLETED",
          bookingStatus: "SERVICE_COMPLETED",
          completedAt: nowIso,
          partnerEarnings: partnerAmount
        };
      }
      return b;
    });

    // Add notifications
    snapshot.notifications = [
      {
        notificationId: "notif_" + Date.now(),
        userId: booking.customerId,
        type: "SERVICE_COMPLETED",
        title: "Service Completed",
        message: `Your service #${bookingId} has concluded. Please take a moment to rate your partner!`,
        isRead: false,
        createdAt: nowIso
      },
      {
        notificationId: "notif_" + (Date.now() + 1),
        userId: partnerId,
        type: "EARNING_CREDITED",
        title: "Earnings Credited",
        message: `₹${partnerAmount} has been credited to your KLEEN earnings ledger for booking #${bookingId}.`,
        isRead: false,
        createdAt: nowIso
      },
      ...(snapshot.notifications || [])
    ];

    this.saveSnapshot(snapshot, "bookings");

    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "SERVICE_COMPLETED",
      targetId: bookingId,
      metadata: { gross, platformCommission, partnerAmount },
      description: `Partner completed booking #${bookingId}. Net earnings: ₹${partnerAmount}`
    });

    return booking;
  }

  // =========================================================================
  // Partner Availability & Schedule Configuration
  // =========================================================================
  getPartnerAvailability(partnerId) {
    const snapshot = this.getSnapshot();
    const existing = (snapshot.partnerAvailability || []).find(a => a.partnerId === partnerId);
    if (existing) return existing;

    // Default availability
    return {
      partnerId,
      isOnline: false,
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      workingHours: {
        startTime: "08:00",
        endTime: "20:00"
      },
      blockedDates: [],
      updatedAt: new Date().toISOString()
    };
  }

  savePartnerAvailability(partnerId, availabilityData) {
    const snapshot = this.getSnapshot();
    const updatedRecord = {
      partnerId,
      ...availabilityData,
      updatedAt: new Date().toISOString()
    };

    const existsIndex = (snapshot.partnerAvailability || []).findIndex(a => a.partnerId === partnerId);
    if (existsIndex >= 0) {
      snapshot.partnerAvailability[existsIndex] = updatedRecord;
    } else {
      snapshot.partnerAvailability = [...(snapshot.partnerAvailability || []), updatedRecord];
    }

    // Sync isOnline flag with partners collection
    snapshot.partners = (snapshot.partners || []).map(p => {
      if (p.partnerId === partnerId || p.userId === partnerId) {
        return { ...p, isOnline: !!availabilityData.isOnline };
      }
      return p;
    });

    this.saveSnapshot(snapshot, "partners");
    return updatedRecord;
  }

  // =========================================================================
  // Partner KYC Document Store
  // =========================================================================
  getPartnerKyc(partnerId) {
    if (!partnerId) return null;
    const snapshot = this.getSnapshot();
    let kyc = (snapshot.partnerKyc || []).find(k => k.partnerId === partnerId || k.userId === partnerId);
    const partner = (snapshot.partners || []).find(p => p.partnerId === partnerId || p.userId === partnerId || p.id === partnerId);
    
    const kycOverride = snapshot.partnerKycStatus?.[partnerId] || 
                        (partner && snapshot.partnerKycStatus?.[partner.partnerId]) || 
                        (partner && snapshot.partnerKycStatus?.[partner.userId]) || 
                        partner?.kycStatus;

    if (kyc) {
      if (kycOverride) {
        kyc = { ...kyc, status: kycOverride };
      }
      return kyc;
    }

    if (partner) {
      return {
        partnerId: partner.partnerId || partnerId,
        userId: partner.userId || partnerId,
        status: kycOverride || partner.kycStatus || "UNDER_REVIEW",
        fullName: partner.fullName,
        dateOfBirth: partner.dateOfBirth,
        gender: partner.gender,
        phone: partner.phone,
        email: partner.email,
        identityDocument: partner.identityDocument || (partner.idProofUrl ? { fileName: "ID_Proof.jpg", fileUrl: partner.idProofUrl } : null),
        addressDocument: partner.addressDocument || (partner.addressProofUrl ? { fileName: "Address_Proof.jpg", fileUrl: partner.addressProofUrl } : null),
        profilePhoto: partner.profilePhoto || (partner.profileImage ? { fileName: "Profile_Photo.jpg", fileUrl: partner.profileImage } : null),
        additionalDocument: partner.additionalDocument || null,
        address: partner.address,
        district: partner.district || partner.city,
        city: partner.city,
        state: partner.state,
        pinCode: partner.pinCode || partner.pin,
        submittedAt: partner.submittedAt || partner.createdAt,
        approvedAt: partner.approvedAt
      };
    }
    return null;
  }

  savePartnerKyc(partnerId, kycData) {
    const snapshot = this.getSnapshot();
    const record = {
      partnerId,
      userId: partnerId,
      ...kycData,
      updatedAt: new Date().toISOString()
    };
    const idx = (snapshot.partnerKyc || []).findIndex(k => k.partnerId === partnerId || k.userId === partnerId);
    if (idx >= 0) {
      snapshot.partnerKyc[idx] = record;
    } else {
      snapshot.partnerKyc = [record, ...(snapshot.partnerKyc || [])];
    }

    // Sync with partner record
    snapshot.partners = (snapshot.partners || []).map(p => {
      if (p.partnerId === partnerId || p.userId === partnerId || p.id === partnerId) {
        return {
          ...p,
          kycStatus: kycData.status || p.kycStatus || "UNDER_REVIEW",
          idProofUrl: kycData.identityDocument?.fileUrl || p.idProofUrl,
          addressProofUrl: kycData.addressDocument?.fileUrl || p.addressProofUrl,
          profileImage: kycData.profilePhoto?.fileUrl || p.profileImage,
          identityDocument: kycData.identityDocument || p.identityDocument,
          addressDocument: kycData.addressDocument || p.addressDocument,
          profilePhoto: kycData.profilePhoto || p.profilePhoto,
          additionalDocument: kycData.additionalDocument || p.additionalDocument
        };
      }
      return p;
    });

    this.saveSnapshot(snapshot, "partners");
    return record;
  }

  // =========================================================================
  // Partner Earnings Ledger
  // =========================================================================
  getPartnerEarnings(partnerId) {
    const snapshot = this.getSnapshot();
    return (snapshot.partnerEarnings || []).filter(e => e.partnerId === partnerId);
  }

  // =========================================================================
  // Partner Bank Details & Financial Settlements
  // =========================================================================

  getPartnerBankDetails(partnerId) {
    let effectiveId = partnerId;
    if (!effectiveId) {
      try {
        const stored = localStorage.getItem("kleen_auth_session_v2");
        if (stored) {
          const curUser = JSON.parse(stored);
          effectiveId = curUser?.partnerId || curUser?.userId;
        }
      } catch (e) {}
    }
    if (!effectiveId) effectiveId = "usr_partner_sunita";

    const snapshot = this.getSnapshot();
    if (snapshot.partnerBankDetails && snapshot.partnerBankDetails[effectiveId]) {
      return snapshot.partnerBankDetails[effectiveId];
    }
    const partner = this.getPartnerById(effectiveId);
    if (partner && partner.bankDetails && partner.bankDetails.accountNumber) {
      return partner.bankDetails;
    }
    const allPartners = snapshot.partners || [];
    const matched = allPartners.find(p => p.partnerId === effectiveId || p.userId === effectiveId || p.id === effectiveId);
    if (matched) {
      if (matched.partnerId && snapshot.partnerBankDetails?.[matched.partnerId]) {
        return snapshot.partnerBankDetails[matched.partnerId];
      }
      if (matched.userId && snapshot.partnerBankDetails?.[matched.userId]) {
        return snapshot.partnerBankDetails[matched.userId];
      }
      if (matched.bankDetails && matched.bankDetails.accountNumber) {
        return matched.bankDetails;
      }
    }

    // Check active auth session
    try {
      const stored = localStorage.getItem("kleen_auth_session_v2");
      if (stored) {
        const curUser = JSON.parse(stored);
        if (curUser && curUser.bankDetails && curUser.bankDetails.accountNumber) {
          return curUser.bankDetails;
        }
      }
    } catch (e) {}

    return null;
  }

  savePartnerBankDetails(partnerId, bankData) {
    let effectiveId = partnerId;
    if (!effectiveId) {
      try {
        const stored = localStorage.getItem("kleen_auth_session_v2");
        if (stored) {
          const curUser = JSON.parse(stored);
          effectiveId = curUser?.partnerId || curUser?.userId;
        }
      } catch (e) {}
    }
    if (!effectiveId) effectiveId = "usr_partner_sunita";

    const snapshot = this.getSnapshot();
    let updatedPartner = null;

    const validatedData = {
      accountHolderName: (bankData.accountHolderName || "").trim(),
      bankName: (bankData.bankName || "").trim(),
      accountNumber: (bankData.accountNumber || "").trim(),
      ifscCode: (bankData.ifscCode || "").trim().toUpperCase(),
      accountType: bankData.accountType || "SAVINGS",
      upiId: (bankData.upiId || "").trim(),
      isVerified: true,
      updatedAt: new Date().toISOString()
    };

    if (!snapshot.partnerBankDetails) {
      snapshot.partnerBankDetails = {};
    }
    snapshot.partnerBankDetails[effectiveId] = validatedData;
    if (partnerId) snapshot.partnerBankDetails[partnerId] = validatedData;

    let partnerFound = false;
    snapshot.partners = (snapshot.partners || []).map(p => {
      if (p.partnerId === effectiveId || p.userId === effectiveId || p.id === effectiveId || (partnerId && (p.partnerId === partnerId || p.userId === partnerId))) {
        partnerFound = true;
        updatedPartner = {
          ...p,
          bankDetails: validatedData
        };
        return updatedPartner;
      }
      return p;
    });

    if (!partnerFound) {
      const user = (snapshot.users || []).find(u => u.userId === effectiveId || u.partnerId === effectiveId);
      const newPartner = {
        partnerId: effectiveId,
        userId: effectiveId,
        fullName: user?.fullName || validatedData.accountHolderName || "Service Partner",
        email: user?.email || "",
        phone: user?.phone || "",
        role: "partner",
        accountStatus: "ACTIVE",
        kycStatus: user?.kycStatus || "APPROVED",
        bankDetails: validatedData,
        createdAt: new Date().toISOString()
      };
      snapshot.partners = [newPartner, ...(snapshot.partners || [])];
      updatedPartner = newPartner;
    }

    if (updatedPartner?.partnerId) snapshot.partnerBankDetails[updatedPartner.partnerId] = validatedData;
    if (updatedPartner?.userId) snapshot.partnerBankDetails[updatedPartner.userId] = validatedData;

    snapshot.users = (snapshot.users || []).map(u => {
      if (u.userId === effectiveId || u.partnerId === effectiveId || (partnerId && (u.userId === partnerId || u.partnerId === partnerId))) {
        return { ...u, bankDetails: validatedData };
      }
      return u;
    });

    this.saveSnapshot(snapshot, "partners", effectiveId, updatedPartner);

    // Sync with active auth session in localStorage
    try {
      const authSessionKey = "kleen_auth_session_v2";
      const stored = localStorage.getItem(authSessionKey);
      if (stored) {
        const curUser = JSON.parse(stored);
        if (curUser) {
          curUser.bankDetails = validatedData;
          localStorage.setItem(authSessionKey, JSON.stringify(curUser));
        }
      }
    } catch (e) {
      console.warn("Session bank sync warning:", e);
    }

    this.logAuditAction({
      actorId: effectiveId,
      actorRole: "partner",
      action: "BANK_DETAILS_UPDATED",
      targetId: effectiveId,
      metadata: { bankName: validatedData.bankName, ifscCode: validatedData.ifscCode },
      description: `Bank account details updated (${validatedData.bankName} - IFSC ${validatedData.ifscCode})`
    });

    return validatedData;
  }

  getPartnerFinancials(partnerId) {
    const partner = this.getPartnerById(partnerId) || {};
    const earnings = this.getPartnerEarnings(partnerId);
    const payouts = this.getPartnerPayouts(partnerId);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const currentYearMonth = todayStr.substring(0, 7);

    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let totalGross = 0;
    let totalCommission = 0;
    let totalNet = 0;

    earnings.forEach(e => {
      const net = e.partnerAmount || 0;
      const gross = e.grossAmount || 0;
      const comm = e.platformCommission || 0;
      const dateStr = e.createdAt || "";

      totalGross += gross;
      totalCommission += comm;
      totalNet += net;

      if (dateStr.startsWith(todayStr)) todayEarnings += net;
      if (dateStr >= oneWeekAgo) weekEarnings += net;
      if (dateStr.startsWith(currentYearMonth)) monthEarnings += net;
    });

    // Fallback if partner has totalEarnings on profile but no itemized earnings records yet
    if (totalNet === 0 && (partner.totalEarnings || 0) > 0) {
      totalNet = partner.totalEarnings;
      totalGross = Math.round(totalNet / 0.8);
      totalCommission = totalGross - totalNet;
    }

    // Sum completed and pending payouts
    let totalPaidOut = 0;
    let pendingPayouts = 0;
    let activeQuickSettleRequest = null;

    payouts.forEach(p => {
      if (p.status === "COMPLETED") {
        totalPaidOut += (p.amount || 0);
      } else if (p.status === "REQUESTED" || p.status === "PROCESSING") {
        pendingPayouts += (p.amount || 0);
        if (p.payoutType === "QUICK_SETTLE") {
          activeQuickSettleRequest = p;
        }
      }
    });

    // Pending settlement
    const pendingSettlement = Math.max(0, totalNet - totalPaidOut);

    // Safety deposit: ₹500 is reserved from pending earnings
    // On weekly payout, this ₹500 is settled along with remaining balance
    const safetyDepositAmount = Math.min(500, pendingSettlement);

    // Quick settle available: Pending earnings minus the ₹500 safety deposit
    const quickSettleAvailable = Math.max(0, pendingSettlement - 500);

    // Calculate next Monday date for weekly payout
    const nextMonday = new Date(now);
    const dayOfWeek = nextMonday.getDay(); // 0 is Sunday, 1 is Monday...
    const daysUntilNextMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);
    nextMonday.setHours(10, 0, 0, 0);

    const resolvedBank = this.getPartnerBankDetails(partnerId) || partner.bankDetails || null;

    return {
      partnerId,
      partnerName: partner.fullName || "Partner",
      bankDetails: resolvedBank,
      hasBankDetails: !!(resolvedBank && resolvedBank.accountNumber),
      totalGross,
      totalCommission,
      totalNet,
      totalPaidOut,
      pendingSettlement,
      safetyDepositAmount,
      quickSettleAvailable,
      todayEarnings,
      weekEarnings,
      monthEarnings,
      nextWeeklyPayoutDate: nextMonday.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
      activeQuickSettleRequest
    };
  }

  getPartnerPayouts(partnerId) {
    const snapshot = this.getSnapshot();
    return (snapshot.payouts || []).filter(p => p.partnerId === partnerId);
  }

  getAllPartnerPayouts() {
    const snapshot = this.getSnapshot();
    return snapshot.payouts || [];
  }

  requestQuickSettle(partnerId, requestedAmount = null, note = "") {
    const financials = this.getPartnerFinancials(partnerId);
    if (!financials.hasBankDetails) {
      throw new Error("Please add and verify your bank account details before requesting Quick Settle.");
    }
    if (financials.quickSettleAvailable <= 0) {
      throw new Error("No withdrawable balance available for Quick Settle. Minimum ₹500 safety deposit is reserved until weekly payout.");
    }
    if (financials.activeQuickSettleRequest) {
      throw new Error("You already have an active Quick Settle request in progress.");
    }

    const amount = requestedAmount ? Math.min(requestedAmount, financials.quickSettleAvailable) : financials.quickSettleAvailable;
    if (amount < 50) {
      throw new Error("Minimum Quick Settle withdrawal amount is ₹50.");
    }

    const snapshot = this.getSnapshot();
    const partner = this.getPartnerById(partnerId);

    const newPayout = {
      payoutId: "po_qs_" + Date.now(),
      partnerId,
      partnerName: partner ? partner.fullName : "Service Partner",
      amount,
      payoutType: "QUICK_SETTLE",
      status: "REQUESTED", // REQUESTED -> PROCESSING -> COMPLETED
      transferMode: "IMPS",
      bankDetails: financials.bankDetails,
      safetyDepositIncluded: false,
      safetyDepositAmount: financials.safetyDepositAmount,
      note: note || "Partner requested on-demand Quick Settle",
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    snapshot.payouts = [newPayout, ...(snapshot.payouts || [])];
    this.saveSnapshot(snapshot, "payouts");

    // Create notification for admin
    this.createNotification({
      userId: "usr_admin_kleen",
      type: "QUICK_SETTLE_REQUESTED",
      title: "Quick Settle Requested",
      message: `${partner ? partner.fullName : 'Partner'} requested instant settlement of ₹${amount} to ${financials.bankDetails.bankName}.`,
      link: "#/admin/payouts",
      metadata: { payoutId: newPayout.payoutId, partnerId, amount }
    });

    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "QUICK_SETTLE_REQUESTED",
      targetId: newPayout.payoutId,
      metadata: { amount, bankName: financials.bankDetails.bankName },
      description: `Quick Settle requested for ₹${amount}`
    });

    return newPayout;
  }

  processPartnerPayout({ payoutId = null, partnerId, amount, transferMode = "IMPS", utrNumber = "", note = "", isWeeklyPayout = false }) {
    const snapshot = this.getSnapshot();
    const partner = this.getPartnerById(partnerId);
    if (!partner) throw new Error("Partner not found.");

    const bankDetails = partner.bankDetails;
    if (!bankDetails || !bankDetails.accountNumber) {
      throw new Error("Cannot process payout: Partner has not registered bank account details.");
    }

    const effectiveUtr = (utrNumber || "").trim() || ("UTR" + Math.floor(100000000000 + Math.random() * 900000000000));
    const nowIso = new Date().toISOString();

    let targetPayout = null;
    if (payoutId) {
      snapshot.payouts = (snapshot.payouts || []).map(p => {
        if (p.payoutId === payoutId) {
          targetPayout = {
            ...p,
            status: "COMPLETED",
            transferMode,
            utrNumber: effectiveUtr,
            processedAt: nowIso,
            processedBy: "usr_admin_kleen",
            note: note || p.note || (isWeeklyPayout ? "Automated weekly batch payout" : "Direct bank settlement")
          };
          return targetPayout;
        }
        return p;
      });
    }

    if (!targetPayout) {
      targetPayout = {
        payoutId: "po_" + Date.now(),
        partnerId,
        partnerName: partner.fullName || "Service Partner",
        amount: Number(amount),
        payoutType: isWeeklyPayout ? "WEEKLY_SCHEDULED" : "ADMIN_MANUAL",
        status: "COMPLETED",
        transferMode,
        utrNumber: effectiveUtr,
        bankDetails,
        safetyDepositIncluded: isWeeklyPayout,
        note: note || (isWeeklyPayout ? "Automated weekly settlement (including safety deposit)" : "Manual admin disbursement"),
        processedAt: nowIso,
        processedBy: "usr_admin_kleen",
        createdAt: nowIso
      };
      snapshot.payouts = [targetPayout, ...(snapshot.payouts || [])];
    }

    // Mark partnerEarnings as PAID up to settled amount
    let remainingToMark = Number(amount);
    if (snapshot.partnerEarnings) {
      snapshot.partnerEarnings = snapshot.partnerEarnings.map(e => {
        if (e.partnerId === partnerId && e.settlementStatus !== "PAID" && remainingToMark > 0) {
          remainingToMark -= (e.partnerAmount || 0);
          return {
            ...e,
            settlementStatus: "PAID",
            settledAt: nowIso,
            payoutId: targetPayout.payoutId
          };
        }
        return e;
      });
    }

    this.saveSnapshot(snapshot, "payouts");

    // Notify the partner
    this.createNotification({
      userId: partnerId,
      type: "PAYOUT_PROCESSED",
      title: isWeeklyPayout ? "Weekly Payout Transferred" : "Funds Transferred to Bank Account",
      message: `₹${targetPayout.amount} has been deposited into your ${bankDetails.bankName} A/C (ending in ${bankDetails.accountNumber.slice(-4)}). Reference UTR: ${effectiveUtr}.`,
      link: "#/partner/earnings",
      metadata: { payoutId: targetPayout.payoutId, amount: targetPayout.amount, utrNumber: effectiveUtr }
    });

    this.logAuditAction({
      actorId: "usr_admin_kleen",
      actorRole: "admin",
      action: "PARTNER_PAYOUT_PROCESSED",
      targetId: targetPayout.payoutId,
      metadata: { partnerId, amount: targetPayout.amount, utrNumber: effectiveUtr, transferMode },
      description: `Disbursed ₹${targetPayout.amount} to ${partner.fullName} via ${transferMode} (UTR: ${effectiveUtr})`
    });

    return targetPayout;
  }

  processBatchWeeklyPayout(partnerIds = []) {
    const snapshot = this.getSnapshot();
    const partners = snapshot.partners || [];
    const eligiblePartners = partners.filter(p => {
      const pKey = p.partnerId || p.userId;
      if (partnerIds.length > 0 && !partnerIds.includes(pKey)) return false;
      const fin = this.getPartnerFinancials(pKey);
      return fin.hasBankDetails && fin.pendingSettlement > 0;
    });

    const results = [];
    eligiblePartners.forEach(p => {
      const pKey = p.partnerId || p.userId;
      const fin = this.getPartnerFinancials(pKey);
      try {
        const payout = this.processPartnerPayout({
          partnerId: pKey,
          amount: fin.pendingSettlement,
          transferMode: "NEFT",
          isWeeklyPayout: true,
          note: "Consolidated Monday weekly payout (including ₹500 safety deposit settlement)"
        });
        results.push(payout);
      } catch (err) {
        console.error(`Batch payout failed for partner ${pKey}:`, err);
      }
    });

    return results;
  }

  // =========================================================================
  // Partner Support Tickets
  // =========================================================================
  getPartnerTickets(partnerId) {
    const snapshot = this.getSnapshot();
    return (snapshot.complaints || []).filter(c => c.createdBy === partnerId || c.partnerId === partnerId);
  }

  createPartnerTicket({ partnerId, subject, category, description, bookingId, attachment }) {
    const snapshot = this.getSnapshot();
    const newTicket = {
      complaintId: "tkt_" + Date.now(),
      createdBy: partnerId,
      partnerId,
      userType: "partner",
      bookingId: bookingId || "",
      subject,
      category: category || "General",
      description,
      attachment: attachment || null,
      status: "OPEN",
      priority: "NORMAL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminResponse: ""
    };
    snapshot.complaints = [newTicket, ...(snapshot.complaints || [])];
    this.saveSnapshot(snapshot, "complaints");

    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "SUPPORT_TICKET_CREATED",
      targetId: newTicket.complaintId,
      metadata: { category, bookingId },
      description: `Support ticket created: ${subject}`
    });

    return newTicket;
  }

  // =========================================================================
  // Notifications
  // =========================================================================
  getNotifications(userId = null) {
    const all = this.getSnapshot().notifications || [];
    if (!userId) return all;
    return all.filter(n => n.userId === userId || n.userId === "all" || n.userId === "all_partners");
  }

  markNotificationAsRead(notificationId) {
    const snapshot = this.getSnapshot();
    snapshot.notifications = (snapshot.notifications || []).map(n => {
      if (n.notificationId === notificationId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.saveSnapshot(snapshot, "notifications");
  }

  markAllNotificationsAsRead(userId = null) {
    const snapshot = this.getSnapshot();
    snapshot.notifications = (snapshot.notifications || []).map(n => {
      if (!userId || n.userId === userId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.saveSnapshot(snapshot, "notifications");
  }

  // =========================================================================
  // Partner Management & KYC Review Workflow
  // =========================================================================
  getPartners() {
    const snapshot = this.getSnapshot();
    return (snapshot.partners || []).map(p => {
      const pKey = p.partnerId || p.userId || p.id;
      const kycOverride = snapshot.partnerKycStatus?.[pKey] || 
                          (p.partnerId && snapshot.partnerKycStatus?.[p.partnerId]) || 
                          (p.userId && snapshot.partnerKycStatus?.[p.userId]);
      if (kycOverride) {
        p.kycStatus = kycOverride;
        if (kycOverride === "APPROVED") {
          p.accountStatus = "ACTIVE";
          p.isEligibleForBooking = true;
        } else if (kycOverride === "REJECTED") {
          p.accountStatus = "SUSPENDED";
          p.isEligibleForBooking = false;
        }
      }
      return p;
    });
  }

  getPartnerById(partnerId) {
    if (!partnerId) return null;
    const snapshot = this.getSnapshot();
    const partner = (snapshot.partners || []).find(p => p.partnerId === partnerId || p.userId === partnerId || p.id === partnerId);
    if (partner) {
      const kycOverride = snapshot.partnerKycStatus?.[partnerId] || 
                          snapshot.partnerKycStatus?.[partner.partnerId] || 
                          snapshot.partnerKycStatus?.[partner.userId];
      if (kycOverride) {
        partner.kycStatus = kycOverride;
        if (kycOverride === "APPROVED") {
          partner.accountStatus = "ACTIVE";
          partner.isEligibleForBooking = true;
        } else if (kycOverride === "REJECTED") {
          partner.accountStatus = "SUSPENDED";
          partner.isEligibleForBooking = false;
        }
      }

      if (!partner.bankDetails || !partner.bankDetails.accountNumber) {
        const savedBank = snapshot.partnerBankDetails?.[partnerId] || 
                          snapshot.partnerBankDetails?.[partner.partnerId] || 
                          snapshot.partnerBankDetails?.[partner.userId];
        if (savedBank) partner.bankDetails = savedBank;
      }
      return partner;
    }
    const user = (snapshot.users || []).find(u => (u.partnerId === partnerId || u.userId === partnerId) && u.role === "partner");
    if (user) {
      const kycOverride = snapshot.partnerKycStatus?.[partnerId] || 
                          snapshot.partnerKycStatus?.[user.partnerId] || 
                          snapshot.partnerKycStatus?.[user.userId];
      if (kycOverride) {
        user.kycStatus = kycOverride;
        if (kycOverride === "APPROVED") {
          user.accountStatus = "ACTIVE";
          user.isEligibleForBooking = true;
        } else if (kycOverride === "REJECTED") {
          user.accountStatus = "SUSPENDED";
          user.isEligibleForBooking = false;
        }
      }

      if (!user.bankDetails || !user.bankDetails.accountNumber) {
        const savedBank = snapshot.partnerBankDetails?.[partnerId] || 
                          snapshot.partnerBankDetails?.[user.partnerId] || 
                          snapshot.partnerBankDetails?.[user.userId];
        if (savedBank) user.bankDetails = savedBank;
      }
      return user;
    }
    return null;
  }

  updatePartnerAvailability(partnerId, isOnline) {
    const snapshot = this.getSnapshot();
    const partner = (snapshot.partners || []).find(p => p.partnerId === partnerId || p.userId === partnerId);
    if (!partner) throw new Error("Partner not found.");

    if (isOnline) {
      if (partner.kycStatus !== "APPROVED") {
        throw new Error("Cannot go online: Your KYC verification is pending administrator approval.");
      }
      if (partner.accountStatus !== "ACTIVE") {
        throw new Error("Cannot go online: Your partner account is not active.");
      }
      if (partner.isEligibleForBooking === false) {
        throw new Error("Cannot go online: Your account is currently not eligible for booking dispatch.");
      }
    }

    // Sync isOnline flag in partners collection
    snapshot.partners = (snapshot.partners || []).map(p => {
      if (p.partnerId === partnerId || p.userId === partnerId) {
        return { ...p, isOnline: !!isOnline };
      }
      return p;
    });

    // Sync in partnerAvailability collection
    if (!snapshot.partnerAvailability) snapshot.partnerAvailability = [];
    const availIdx = snapshot.partnerAvailability.findIndex(a => a.partnerId === partnerId);
    if (availIdx >= 0) {
      snapshot.partnerAvailability[availIdx] = {
        ...snapshot.partnerAvailability[availIdx],
        isOnline: !!isOnline,
        updatedAt: new Date().toISOString()
      };
    } else {
      snapshot.partnerAvailability.push({
        partnerId,
        isOnline: !!isOnline,
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        workingHours: { startTime: "08:00", endTime: "20:00" },
        blockedDates: [],
        updatedAt: new Date().toISOString()
      });
    }

    this.saveSnapshot(snapshot, "partners");

    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: isOnline ? "PARTNER_ONLINE" : "PARTNER_OFFLINE",
      targetId: partnerId,
      description: `Partner ${partner.fullName || partnerId} switched ${isOnline ? 'ONLINE' : 'OFFLINE'}`
    });

    return !!isOnline;
  }

  removePartnerProfilePhoto(partnerId) {
    const snapshot = this.getSnapshot();
    snapshot.partners = (snapshot.partners || []).map(p => {
      if (p.partnerId === partnerId || p.userId === partnerId) {
        return { ...p, profileImage: null };
      }
      return p;
    });
    this.saveSnapshot(snapshot, "partners");

    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "PROFILE_PHOTO_REMOVED",
      targetId: partnerId,
      description: `Partner ${partnerId} removed profile photo`
    });
  }

  submitKycApplication(partnerId, kycPayload) {
    const snapshot = this.getSnapshot();
    snapshot.partners = (snapshot.partners || []).map(p => {
      if (p.partnerId === partnerId || p.userId === partnerId) {
        return {
          ...p,
          ...kycPayload,
          kycStatus: "UNDER_REVIEW",
          accountStatus: "PENDING_VERIFICATION",
          submittedAt: new Date().toISOString()
        };
      }
      return p;
    });

    // Add admin notification
    snapshot.notifications = [
      {
        notificationId: "notif_" + Date.now(),
        userId: "usr_admin_kleen",
        type: "NEW_KYC_SUBMISSION",
        title: "New Partner KYC Submitted",
        message: `Partner ${kycPayload.fullName || partnerId} submitted verification documents for review.`,
        isRead: false,
        createdAt: new Date().toISOString()
      },
      ...(snapshot.notifications || [])
    ];

    this.saveSnapshot(snapshot, "partners");

    this.logAuditAction({
      actorId: partnerId,
      actorRole: "partner",
      action: "KYC_SUBMISSION",
      targetId: partnerId,
      description: `Partner ${partnerId} submitted KYC application`
    });
  }

  adminReviewKyc(partnerId, decision, rejectionReason = "") {
    const snapshot = this.getSnapshot();
    let partnerName = "";
    const statusValue = decision === "APPROVE" ? "APPROVED" : (decision === "REJECT" ? "REJECTED" : "UNDER_REVIEW");

    if (!snapshot.partnerKycStatus) {
      snapshot.partnerKycStatus = {};
    }
    snapshot.partnerKycStatus[partnerId] = statusValue;

    let matchedPartner = null;
    snapshot.partners = (snapshot.partners || []).map(p => {
      if (p.partnerId === partnerId || p.userId === partnerId || p.id === partnerId) {
        partnerName = p.fullName || "Partner";
        matchedPartner = {
          ...p,
          kycStatus: statusValue,
          accountStatus: decision === "APPROVE" ? "ACTIVE" : (decision === "REJECT" ? "SUSPENDED" : p.accountStatus),
          isEligibleForBooking: decision === "APPROVE" ? true : false,
          approvedAt: decision === "APPROVE" ? new Date().toISOString() : p.approvedAt,
          approvedBy: decision === "APPROVE" ? "usr_admin_kleen" : p.approvedBy,
          rejectionReason: decision === "REJECT" ? (rejectionReason || "Incomplete documentation. Please re-upload clear government ID.") : undefined,
          reviewedAt: new Date().toISOString()
        };
        return matchedPartner;
      }
      return p;
    });

    if (matchedPartner) {
      if (matchedPartner.partnerId) snapshot.partnerKycStatus[matchedPartner.partnerId] = statusValue;
      if (matchedPartner.userId) snapshot.partnerKycStatus[matchedPartner.userId] = statusValue;
    }

    let kycFound = false;
    snapshot.partnerKyc = (snapshot.partnerKyc || []).map(k => {
      if (k.partnerId === partnerId || k.userId === partnerId || (matchedPartner && (k.partnerId === matchedPartner.partnerId || k.userId === matchedPartner.userId))) {
        kycFound = true;
        return {
          ...k,
          status: statusValue,
          rejectionReason: decision === "REJECT" ? rejectionReason : k.rejectionReason,
          reviewedAt: new Date().toISOString(),
          approvedAt: decision === "APPROVE" ? new Date().toISOString() : k.approvedAt
        };
      }
      return k;
    });

    if (!kycFound) {
      snapshot.partnerKyc = [
        {
          partnerId: matchedPartner?.partnerId || partnerId,
          userId: matchedPartner?.userId || partnerId,
          status: statusValue,
          rejectionReason: decision === "REJECT" ? rejectionReason : undefined,
          reviewedAt: new Date().toISOString(),
          approvedAt: decision === "APPROVE" ? new Date().toISOString() : undefined
        },
        ...(snapshot.partnerKyc || [])
      ];
    }

    // Sync users collection
    snapshot.users = (snapshot.users || []).map(u => {
      if (u.userId === partnerId || u.partnerId === partnerId || (matchedPartner && (u.userId === matchedPartner.userId || u.partnerId === matchedPartner.partnerId))) {
        return {
          ...u,
          kycStatus: statusValue,
          accountStatus: decision === "APPROVE" ? "ACTIVE" : (decision === "REJECT" ? "SUSPENDED" : u.accountStatus),
          isEligibleForBooking: decision === "APPROVE" ? true : false
        };
      }
      return u;
    });

    // Sync active session in localStorage if partner is currently logged in
    try {
      const authSessionKey = "kleen_auth_session_v2";
      const stored = localStorage.getItem(authSessionKey);
      if (stored) {
        const curUser = JSON.parse(stored);
        if (curUser && (curUser.userId === partnerId || curUser.partnerId === partnerId || (matchedPartner && (curUser.userId === matchedPartner.userId || curUser.partnerId === matchedPartner.partnerId)))) {
          curUser.kycStatus = statusValue;
          curUser.accountStatus = decision === "APPROVE" ? "ACTIVE" : (decision === "REJECT" ? "SUSPENDED" : curUser.accountStatus);
          curUser.isEligibleForBooking = decision === "APPROVE" ? true : false;
          localStorage.setItem(authSessionKey, JSON.stringify(curUser));
        }
      }
    } catch (e) {
      console.warn("Session KYC sync warning:", e);
    }

    // Create notification for the partner
    snapshot.notifications = [
      {
        notificationId: "notif_" + Date.now(),
        userId: partnerId,
        type: decision === "APPROVE" ? "KYC_APPROVED" : "KYC_REJECTED",
        title: decision === "APPROVE" ? "KYC Approved" : "KYC Update Required",
        message: decision === "APPROVE"
          ? "Congratulations! Your KYC documents are verified. You can now accept booking requests."
          : `Your verification could not be approved: ${rejectionReason}`,
        isRead: false,
        createdAt: new Date().toISOString()
      },
      ...(snapshot.notifications || [])
    ];

    // Log admin action
    snapshot.adminLogs = [
      {
        logId: "log_" + Date.now(),
        adminId: "usr_admin_kleen",
        action: `KYC_${decision}`,
        targetType: "PARTNER",
        targetId: partnerId,
        description: `Admin reviewed partner ${partnerName || partnerId} KYC: ${decision}. ${rejectionReason ? "Reason: " + rejectionReason : ""}`,
        timestamp: new Date().toISOString()
      },
      ...(snapshot.adminLogs || [])
    ];

    this.saveSnapshot(snapshot, "partners", partnerId, matchedPartner);
    if (matchedPartner?.partnerId) {
      this.saveSnapshot(snapshot, "partnerKyc", matchedPartner.partnerId, { status: statusValue, reviewedAt: new Date().toISOString() });
    }
  }

  // =========================================================================
  // Reviews & Customer Complaints
  // =========================================================================
  getReviews() {
    return this.getSnapshot().reviews || [];
  }

  submitReview(reviewData) {
    const snapshot = this.getSnapshot();
    const newRev = {
      reviewId: "rev_" + Date.now(),
      status: "APPROVED",
      createdAt: new Date().toISOString(),
      ...reviewData
    };
    snapshot.reviews = [newRev, ...(snapshot.reviews || [])];

    // Recalculate partner rating
    if (newRev.partnerId) {
      snapshot.partners = (snapshot.partners || []).map(p => {
        if (p.partnerId === newRev.partnerId || p.userId === newRev.partnerId) {
          const prevTotal = p.totalRatings || 0;
          const prevRating = p.rating || 5;
          const newTotal = prevTotal + 1;
          const updatedRating = Number(((prevRating * prevTotal + newRev.rating) / newTotal).toFixed(1));
          return { ...p, rating: updatedRating, totalRatings: newTotal };
        }
        return p;
      });
    }

    this.saveSnapshot(snapshot, "reviews");
    return newRev;
  }

  getComplaints() {
    return this.getSnapshot().complaints || [];
  }

  submitComplaint(complaintData) {
    const snapshot = this.getSnapshot();
    const newCmp = {
      complaintId: "cmp_" + Date.now(),
      status: "OPEN",
      priority: "HIGH",
      createdAt: new Date().toISOString(),
      adminResponse: "",
      ...complaintData
    };
    snapshot.complaints = [newCmp, ...(snapshot.complaints || [])];
    this.saveSnapshot(snapshot, "complaints");
    return newCmp;
  }

  resolveComplaint(complaintId, adminResponse) {
    const snapshot = this.getSnapshot();
    snapshot.complaints = (snapshot.complaints || []).map(c => {
      if (c.complaintId === complaintId) {
        return {
          ...c,
          status: "RESOLVED",
          adminResponse,
          resolvedAt: new Date().toISOString()
        };
      }
      return c;
    });
    this.saveSnapshot(snapshot, "complaints");
  }

  // =========================================================================
  // Customer Addresses
  // =========================================================================
  getCustomerAddresses(userId) {
    const snapshot = this.getSnapshot();
    const user = (snapshot.users || []).find(u => u.userId === userId);
    return (user && user.addresses) || [];
  }

  addCustomerAddress(userId, newAddress) {
    const snapshot = this.getSnapshot();
    let found = false;
    const addrId = "addr_" + Date.now();
    snapshot.users = (snapshot.users || []).map(u => {
      if (u.userId === userId) {
        found = true;
        const isFirst = !(u.addresses && u.addresses.length > 0);
        const address = { addressId: addrId, isDefault: isFirst || !!newAddress.isDefault, ...newAddress };
        return { ...u, addresses: [...(u.addresses || []), address] };
      }
      return u;
    });
    if (!found) {
      const address = { addressId: addrId, isDefault: true, ...newAddress };
      snapshot.users = [...(snapshot.users || []), { userId, fullName: "Customer", addresses: [address] }];
    }
    this.saveSnapshot(snapshot, "users");
    return addrId;
  }

  updateCustomerAddress(userId, addressId, updatedData) {
    const snapshot = this.getSnapshot();
    let updatedAddress = null;
    snapshot.users = (snapshot.users || []).map(u => {
      if (u.userId === userId) {
        const addresses = (u.addresses || []).map(a => {
          if (a.addressId === addressId) {
            updatedAddress = { ...a, ...updatedData };
            return updatedAddress;
          }
          return a;
        });
        return { ...u, addresses };
      }
      return u;
    });
    this.saveSnapshot(snapshot, "users");
    return updatedAddress;
  }

  deleteCustomerAddress(userId, addressId) {
    const snapshot = this.getSnapshot();
    snapshot.users = (snapshot.users || []).map(u => {
      if (u.userId === userId) {
        return { ...u, addresses: (u.addresses || []).filter(a => a.addressId !== addressId) };
      }
      return u;
    });
    this.saveSnapshot(snapshot, "users");
  }

  setDefaultCustomerAddress(userId, addressId) {
    const snapshot = this.getSnapshot();
    snapshot.users = (snapshot.users || []).map(u => {
      if (u.userId === userId) {
        return {
          ...u,
          addresses: (u.addresses || []).map(a => ({ ...a, isDefault: a.addressId === addressId }))
        };
      }
      return u;
    });
    this.saveSnapshot(snapshot, "users");
  }

  updateUserProfile(userId, updates) {
    const snapshot = this.getSnapshot();
    let updatedUser = null;
    snapshot.users = (snapshot.users || []).map(u => {
      if (u.userId === userId) {
        updatedUser = { ...u, ...updates };
        return updatedUser;
      }
      return u;
    });
    if (!updatedUser) {
      updatedUser = { userId, ...updates };
      snapshot.users = [...(snapshot.users || []), updatedUser];
    }
    this.saveSnapshot(snapshot, "users");
    return updatedUser;
  }

  // =========================================================================
  // Customer & Partner Management (Admin Operations)
  // =========================================================================

  toggleUserStatus(userId) {
    const snapshot = this.getSnapshot();
    let updatedStatus = "ACTIVE";
    let found = false;

    snapshot.users = (snapshot.users || []).map(u => {
      if (u.userId === userId) {
        found = true;
        updatedStatus = u.accountStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
        return { ...u, accountStatus: updatedStatus };
      }
      return u;
    });

    if (found) {
      snapshot.adminLogs = [
        {
          logId: "log_" + Date.now(),
          adminId: "usr_admin_kleen",
          action: "USER_STATUS_TOGGLED",
          targetType: "USER",
          targetId: userId,
          description: `User ${userId} account status updated to ${updatedStatus}`,
          timestamp: new Date().toISOString()
        },
        ...(snapshot.adminLogs || [])
      ];
      this.saveSnapshot(snapshot, "users");
    }

    return updatedStatus;
  }

  deleteCustomer(userId) {
    const snapshot = this.getSnapshot();
    const existing = (snapshot.users || []).find(u => u.userId === userId);
    const customerName = existing ? (existing.fullName || existing.email || userId) : userId;

    // 1. Remove from users collection
    snapshot.users = (snapshot.users || []).filter(u => u.userId !== userId);

    // 2. Remove user-specific notifications
    snapshot.notifications = (snapshot.notifications || []).filter(n => n.userId !== userId);

    // 3. Remove customer complaints & reviews
    snapshot.complaints = (snapshot.complaints || []).filter(c => c.customerId !== userId && c.userId !== userId);
    snapshot.reviews = (snapshot.reviews || []).filter(r => r.customerId !== userId && r.userId !== userId);

    // 4. Remove bookings created by this customer
    snapshot.bookings = (snapshot.bookings || []).filter(b => b.customerId !== userId && b.userId !== userId);

    // 5. Track in deleted user IDs to prevent resurrection
    snapshot.deletedUserIds = [...(snapshot.deletedUserIds || []), userId];

    // 6. Record audit log
    snapshot.adminLogs = [
      {
        logId: "log_" + Date.now(),
        adminId: "usr_admin_kleen",
        action: "CUSTOMER_DELETED",
        targetType: "CUSTOMER",
        targetId: userId,
        description: `Admin permanently deleted customer: ${customerName} (ID: ${userId})`,
        timestamp: new Date().toISOString()
      },
      ...(snapshot.adminLogs || [])
    ];

    this.saveSnapshot(snapshot, "users");

    // Sync Firestore deletion if live
    if (firebaseClient.isLive) {
      firebaseClient.deleteDoc("users", userId);
    }

    return true;
  }

  deletePartner(partnerId) {
    const snapshot = this.getSnapshot();
    const existing = (snapshot.partners || []).find(p => p.partnerId === partnerId || p.userId === partnerId || p.id === partnerId)
      || (snapshot.users || []).find(u => u.userId === partnerId || u.partnerId === partnerId);
    const partnerName = existing ? (existing.fullName || partnerId) : partnerId;

    // 1. Remove from partners collection
    snapshot.partners = (snapshot.partners || []).filter(p =>
      p.partnerId !== partnerId && p.userId !== partnerId && p.id !== partnerId
    );

    // 2. Remove from users collection if partner account exists there
    snapshot.users = (snapshot.users || []).filter(u =>
      u.userId !== partnerId && u.partnerId !== partnerId
    );

    // 3. Remove from partner KYC collection
    snapshot.partnerKyc = (snapshot.partnerKyc || []).filter(k =>
      k.partnerId !== partnerId && k.userId !== partnerId
    );

    // 4. Remove partner availability & earnings records
    snapshot.partnerAvailability = (snapshot.partnerAvailability || []).filter(a =>
      a.partnerId !== partnerId
    );
    snapshot.partnerEarnings = (snapshot.partnerEarnings || []).filter(e =>
      e.partnerId !== partnerId
    );

    // 5. Remove partner notifications
    snapshot.notifications = (snapshot.notifications || []).filter(n =>
      n.userId !== partnerId && n.partnerId !== partnerId
    );

    // 6. Reset bookings assigned to this partner so bookings remain healthy
    snapshot.bookings = (snapshot.bookings || []).map(b => {
      if (b.partnerId === partnerId) {
        return {
          ...b,
          partnerId: null,
          partnerName: null,
          partnerAssignmentStatus: "UNASSIGNED",
          bookingStatus: (b.bookingStatus === "SERVICE_COMPLETED" || b.bookingStatus === "CUSTOMER_CANCELLED")
            ? b.bookingStatus
            : "CONFIRMED"
        };
      }
      return b;
    });

    // 7. Track in deleted partner IDs
    snapshot.deletedPartnerIds = [...(snapshot.deletedPartnerIds || []), partnerId];

    // 8. Record audit log
    snapshot.adminLogs = [
      {
        logId: "log_" + Date.now(),
        adminId: "usr_admin_kleen",
        action: "PARTNER_DELETED",
        targetType: "PARTNER",
        targetId: partnerId,
        description: `Admin permanently deleted partner: ${partnerName} (ID: ${partnerId})`,
        timestamp: new Date().toISOString()
      },
      ...(snapshot.adminLogs || [])
    ];

    this.saveSnapshot(snapshot, "partners");

    // Sync Firestore deletion if live
    if (firebaseClient.isLive) {
      firebaseClient.deleteDoc("partners", partnerId);
      firebaseClient.deleteDoc("users", partnerId);
    }

    return true;
  }
}

export const db = new DatabaseService();
