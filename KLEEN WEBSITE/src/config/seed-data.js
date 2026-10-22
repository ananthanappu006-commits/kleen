/**
 * KLEEN Seed Data
 * 10 recommended service categories with 19 services, realistic photography,
 * initial categories, demo users and settings.
 */

export const SEED_CATEGORIES = [
  {
    categoryId: "cat_home_cleaning",
    name: "Home Cleaning",
    description: "Sweeping, mopping, dusting & full house cleaning",
    icon: "home",
    image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80",
    isActive: true,
    sortOrder: 1
  },
  {
    categoryId: "cat_bathroom_cleaning",
    name: "Bathroom Cleaning",
    description: "Tile descaling, stain removal & full sanitization",
    icon: "droplet",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    isActive: true,
    sortOrder: 2
  },
  {
    categoryId: "cat_kitchen_cleaning",
    name: "Kitchen Cleaning",
    description: "Chimney degreasing, slab scrubbing & cabinet care",
    icon: "utensils",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
    isActive: true,
    sortOrder: 3
  },
  {
    categoryId: "cat_dishwashing",
    name: "Dishwashing",
    description: "Utensil washing, cooking vessels & post-meal cleanup",
    icon: "coffee",
    image: "https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=600&q=80",
    isActive: true,
    sortOrder: 4
  },
  {
    categoryId: "cat_laundry",
    name: "Laundry",
    description: "Washing, drying, folding & clothes sorting",
    icon: "check-circle",
    image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80",
    isActive: true,
    sortOrder: 5
  },
  {
    categoryId: "cat_ironing",
    name: "Ironing & Folding",
    description: "Shirt, pant, saree ironing & clothes folding",
    icon: "zap",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80",
    isActive: true,
    sortOrder: 6
  },
  {
    categoryId: "cat_dusting_windows",
    name: "Dusting & Windows",
    description: "Furniture dusting, window glass & fan cleaning",
    icon: "wind",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    isActive: true,
    sortOrder: 7
  },
  {
    categoryId: "cat_balcony",
    name: "Balcony Cleaning",
    description: "Balcony sweeping, mopping & outdoor washing",
    icon: "sun",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80",
    isActive: true,
    sortOrder: 8
  },
  {
    categoryId: "cat_appliance",
    name: "Appliance Cleaning",
    description: "Fridge, microwave, washing machine & fan cleaning",
    icon: "cpu",
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=600&q=80",
    isActive: true,
    sortOrder: 9
  },
  {
    categoryId: "cat_hourly_maid",
    name: "Hourly Maid Help",
    description: "Flexible hourly household assistance for any chores",
    icon: "clock",
    image: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=600&q=80",
    isActive: true,
    sortOrder: 10
  }
];

export const SEED_SERVICES = [

  // ═══════════════════════════════════════════════════════
  // 1. HOME CLEANING
  // ═══════════════════════════════════════════════════════
  {
    serviceId: "srv_home_1bhk",
    categoryId: "cat_home_cleaning",
    name: "Home Cleaning \u2014 1 BHK",
    description: "Complete sweeping, mopping, dusting and surface wiping for a 1 BHK home.",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    price: 499,
    duration: "1.5 hrs",
    rating: 4.8,
    reviewCount: 1240,
    bookingType: "Fixed",
    includedTasks: [
      "Dry sweeping all rooms",
      "Fragrant wet mopping",
      "Dusting furniture, shelves & ceiling fans",
      "Surface wiping (tables, doors, switches)",
      "Trash bag removal"
    ],
    excludedTasks: ["Deep stain scrubbing", "Bathroom & kitchen interior"],
    isActive: true,
    sortOrder: 1
  },
  {
    serviceId: "srv_home_2bhk",
    categoryId: "cat_home_cleaning",
    name: "Home Cleaning \u2014 2 BHK",
    description: "Regular home cleaning covering all rooms, halls and common areas of a 2 BHK.",
    image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
    price: 749,
    duration: "2.5 hrs",
    rating: 4.8,
    reviewCount: 2100,
    bookingType: "Fixed",
    includedTasks: [
      "Sweeping & mopping all rooms",
      "Full furniture & surface dusting",
      "Bed making and cushion arrangement",
      "Trash disposal from all rooms",
      "Window sill and door frame wipe"
    ],
    excludedTasks: ["Balcony deep wash", "Appliance interiors"],
    isActive: true,
    sortOrder: 2
  },
  {
    serviceId: "srv_home_3bhk",
    categoryId: "cat_home_cleaning",
    name: "Home Cleaning \u2014 3 BHK",
    description: "Comprehensive regular cleaning for a 3 BHK including all bedrooms, hall and dining.",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    price: 999,
    duration: "3.5 hrs",
    rating: 4.7,
    reviewCount: 980,
    bookingType: "Fixed",
    includedTasks: [
      "Full sweep and mop of all 3 bedrooms + hall",
      "Ceiling fan, tube light and surface dusting",
      "Bed making in all rooms",
      "Trash removal from every room",
      "Mirror and glass surface wiping"
    ],
    excludedTasks: ["Bathroom & kitchen deep clean", "Carpet shampooing"],
    isActive: true,
    sortOrder: 3
  },
  {
    serviceId: "srv_home_deep",
    categoryId: "cat_home_cleaning",
    name: "Full Home Deep Cleaning",
    description: "Intensive corner-to-corner deep clean including floors, walls, kitchen, bathrooms and balcony.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    price: 1899,
    duration: "5.0 hrs",
    rating: 4.9,
    reviewCount: 1420,
    bookingType: "Fixed",
    includedTasks: [
      "Machine scrubbing of all floors",
      "Bathroom tile descaling (up to 2 bathrooms)",
      "Kitchen countertop, backsplash & cabinet degreasing",
      "Balcony floor wash and window glass cleaning",
      "Ceiling fan detailed cleaning",
      "Switchboard and light fixture dust removal"
    ],
    excludedTasks: ["Interior closet decluttering (add-on)", "Chimney motor dismantling"],
    isActive: true,
    sortOrder: 4
  },

  // ═══════════════════════════════════════════════════════
  // 2. BATHROOM CLEANING
  // ═══════════════════════════════════════════════════════
  {
    serviceId: "srv_bathroom_regular",
    categoryId: "cat_bathroom_cleaning",
    name: "Bathroom Cleaning",
    description: "Floor, tiles, toilet, basin, mirror and shower area cleaning with full sanitization.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    price: 349,
    duration: "1.0 hr",
    rating: 4.8,
    reviewCount: 1890,
    bookingType: "Fixed",
    includedTasks: [
      "Floor and tile scrubbing",
      "Toilet bowl disinfection",
      "Basin and tap cleaning",
      "Mirror polishing",
      "Shower area scrub and odor control"
    ],
    excludedTasks: ["Plumbing repairs", "Ceiling leakage fixes"],
    isActive: true,
    sortOrder: 5
  },
  {
    serviceId: "srv_bathroom_deep",
    categoryId: "cat_bathroom_cleaning",
    name: "Bathroom Deep Cleaning",
    description: "Hard-water stain removal, tile grout scrubbing, tap descaling and full disinfection.",
    image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80",
    price: 549,
    duration: "1.5 hrs",
    rating: 4.9,
    reviewCount: 870,
    bookingType: "Fixed",
    includedTasks: [
      "Hard-water stain and tile grout removal",
      "WC, showerhead and chrome fitting descaling",
      "Drain blockage check and flush",
      "Exhaust fan cleaning",
      "Full wall and floor acid wash"
    ],
    excludedTasks: ["Plumbing pipe replacement", "Waterproofing work"],
    isActive: true,
    sortOrder: 6
  },

  // ═══════════════════════════════════════════════════════
  // 3. KITCHEN CLEANING
  // ═══════════════════════════════════════════════════════
  {
    serviceId: "srv_kitchen_regular",
    categoryId: "cat_kitchen_cleaning",
    name: "Kitchen Cleaning",
    description: "Kitchen floor, countertop, sink, stove, chimney exterior and cabinet cleaning.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
    price: 499,
    duration: "1.5 hrs",
    rating: 4.8,
    reviewCount: 740,
    bookingType: "Fixed",
    includedTasks: [
      "Kitchen floor sweep and mop",
      "Countertop and slab wipe",
      "Sink scrubbing and drain flush",
      "Stove and burner cleaning",
      "Chimney/exhaust exterior wipe",
      "Cabinet exterior cleaning"
    ],
    excludedTasks: ["Chimney motor dismantling", "Inside-oven deep scrub"],
    isActive: true,
    sortOrder: 7
  },
  {
    serviceId: "srv_kitchen_deep",
    categoryId: "cat_kitchen_cleaning",
    name: "Kitchen Deep Cleaning",
    description: "High-power degreasing for chimneys, stovetops, exhaust fans, cabinets and full floor scrub.",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    price: 849,
    duration: "2.5 hrs",
    rating: 4.9,
    reviewCount: 650,
    bookingType: "Fixed",
    includedTasks: [
      "Chimney/exhaust exterior grease filter soak",
      "Gas stove burners & countertop descaling",
      "Sink stain scrubbing and drain flush",
      "Cabinet interior and exterior degreasing",
      "Full floor grease removal"
    ],
    excludedTasks: ["Chimney motor dismantling", "Microwave interior (add-on)"],
    isActive: true,
    sortOrder: 8
  },

  // ═══════════════════════════════════════════════════════
  // 4. DISHWASHING
  // ═══════════════════════════════════════════════════════
  {
    serviceId: "srv_dishwashing",
    categoryId: "cat_dishwashing",
    name: "Dishwashing & Utensil Cleaning",
    description: "Complete utensil washing \u2014 plates, bowls, cooking vessels, pots and post-meal kitchen cleanup.",
    image: "https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=800&q=80",
    price: 199,
    duration: "45 mins",
    rating: 4.7,
    reviewCount: 1540,
    bookingType: "One-time / Daily / Weekly",
    includedTasks: [
      "Dishwashing with hot-water scrub",
      "Plates, bowls, glasses and cutlery",
      "Cooking vessels and pressure cooker",
      "Drying and stacking on rack",
      "Sink basin sanitization"
    ],
    excludedTasks: ["Dishwasher appliance repair", "Pantry restocking"],
    isActive: true,
    sortOrder: 9
  },

  // ═══════════════════════════════════════════════════════
  // 5. LAUNDRY
  // ═══════════════════════════════════════════════════════
  {
    serviceId: "srv_laundry",
    categoryId: "cat_laundry",
    name: "Laundry Service",
    description: "Washing, drying assistance, folding and clothes sorting \u2014 one-time or recurring.",
    image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80",
    price: 299,
    duration: "1.5 hrs",
    rating: 4.7,
    reviewCount: 820,
    bookingType: "One-time / Daily / Weekly / Recurring",
    includedTasks: [
      "Color sorting and washing machine operation",
      "Hanging clothes for drying",
      "Clothes folding and stacking",
      "Wardrobe arrangement"
    ],
    excludedTasks: ["Dry-cleaning delicate fabrics", "Tailoring adjustments"],
    isActive: true,
    sortOrder: 10
  },
  {
    serviceId: "srv_laundry_ironing",
    categoryId: "cat_laundry",
    name: "Laundry + Ironing Package",
    description: "Complete laundry cycle \u2014 wash, dry, iron and fold up to 12 garments.",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    price: 499,
    duration: "2.5 hrs",
    rating: 4.8,
    reviewCount: 610,
    bookingType: "Fixed",
    includedTasks: [
      "Machine wash (color sorted)",
      "Drying assistance",
      "Ironing up to 12 shirts, pants or sarees",
      "Neat fold and wardrobe stack"
    ],
    excludedTasks: ["Dry-clean garments", "Silk saree special care"],
    isActive: true,
    sortOrder: 11
  },

  // ═══════════════════════════════════════════════════════
  // 6. IRONING & FOLDING
  // ═══════════════════════════════════════════════════════
  {
    serviceId: "srv_ironing",
    categoryId: "cat_ironing",
    name: "Ironing & Folding",
    description: "Professional ironing of shirts, pants, sarees and general clothes plus neat folding.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    price: 149,
    duration: "45 mins",
    rating: 4.6,
    reviewCount: 1020,
    bookingType: "Fixed",
    includedTasks: [
      "Shirt and pant ironing (up to 10 pcs)",
      "Saree and dupatta pressing",
      "Clothes folding",
      "Wardrobe stacking"
    ],
    excludedTasks: ["Delicate silk saree special pressing", "Dry-clean items"],
    isActive: true,
    sortOrder: 12
  },

  // ═══════════════════════════════════════════════════════
  // 7. DUSTING & WINDOW CLEANING
  // ═══════════════════════════════════════════════════════
  {
    serviceId: "srv_dusting_windows",
    categoryId: "cat_dusting_windows",
    name: "Dusting & Window Cleaning",
    description: "Furniture dusting, window glass, door frame, fan and mirror cleaning.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    price: 349,
    duration: "1.5 hrs",
    rating: 4.7,
    reviewCount: 580,
    bookingType: "Fixed",
    includedTasks: [
      "All furniture and shelf dusting",
      "Window glass cleaning (inside)",
      "Window frame and grill wipe",
      "Ceiling fan blade cleaning",
      "Door frame and mirror cleaning"
    ],
    excludedTasks: ["Exterior facade window cleaning above 10ft"],
    isActive: true,
    sortOrder: 13
  },

  // ═══════════════════════════════════════════════════════
  // 8. BALCONY CLEANING
  // ═══════════════════════════════════════════════════════
  {
    serviceId: "srv_balcony",
    categoryId: "cat_balcony",
    name: "Balcony Cleaning",
    description: "Balcony sweeping, mopping, dust removal, washing and basic plant watering.",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    price: 249,
    duration: "1.0 hr",
    rating: 4.7,
    reviewCount: 430,
    bookingType: "Fixed",
    includedTasks: [
      "Balcony floor sweeping",
      "Wet mop and pressure wash",
      "Dust and cobweb removal",
      "Grill and railing wipe",
      "Basic plant watering/care"
    ],
    excludedTasks: ["Garden landscaping", "Exterior wall painting"],
    isActive: true,
    sortOrder: 14
  },

  // ═══════════════════════════════════════════════════════
  // 9. APPLIANCE / FRIDGE CLEANING
  // ═══════════════════════════════════════════════════════
  {
    serviceId: "srv_fridge_cleaning",
    categoryId: "cat_appliance",
    name: "Refrigerator Cleaning",
    description: "Interior and exterior fridge cleaning including shelves, drawers and door seals.",
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80",
    price: 349,
    duration: "1.0 hr",
    rating: 4.8,
    reviewCount: 390,
    bookingType: "Fixed",
    includedTasks: [
      "Full interior shelf and drawer wipe",
      "Door seal and gasket cleaning",
      "Exterior surface polish",
      "Odor control deodorizer application",
      "Vegetable tray scrub"
    ],
    excludedTasks: ["Compressor or motor repair"],
    isActive: true,
    sortOrder: 15
  },
  {
    serviceId: "srv_appliance_cleaning",
    categoryId: "cat_appliance",
    name: "Kitchen Appliance Cleaning",
    description: "Microwave, washing machine exterior, fan and other kitchen appliance cleaning.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
    price: 449,
    duration: "1.5 hrs",
    rating: 4.7,
    reviewCount: 270,
    bookingType: "Fixed",
    includedTasks: [
      "Microwave interior and exterior wipe",
      "Washing machine exterior and drum cleaning",
      "Ceiling/table fan cleaning",
      "Kitchen appliance exterior polish"
    ],
    excludedTasks: ["Appliance electrical repairs", "AC indoor unit servicing"],
    isActive: true,
    sortOrder: 16
  },

  // ═══════════════════════════════════════════════════════
  // 10. HOURLY MAID HELP
  // ═══════════════════════════════════════════════════════
  {
    serviceId: "srv_hourly_2hr",
    categoryId: "cat_hourly_maid",
    name: "Hourly Maid Help \u2014 2 Hours",
    description: "Flexible 2-hour household help \u2014 any combination of cleaning, dishwashing, laundry or chores.",
    image: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80",
    price: 399,
    duration: "2.0 hrs",
    rating: 4.8,
    reviewCount: 2880,
    bookingType: "Hourly",
    includedTasks: [
      "Any household task within 2 hours",
      "Sweeping, mopping, dusting",
      "Dishwashing or laundry folding",
      "General household organization"
    ],
    excludedTasks: ["Specialized deep cleaning", "Outdoor heavy-duty work"],
    isActive: true,
    sortOrder: 17
  },
  {
    serviceId: "srv_hourly_4hr",
    categoryId: "cat_hourly_maid",
    name: "Hourly Maid Help \u2014 4 Hours",
    description: "4-hour flexible maid assistance ideal for multiple chores across rooms, kitchen and laundry.",
    image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80",
    price: 749,
    duration: "4.0 hrs",
    rating: 4.8,
    reviewCount: 1920,
    bookingType: "Hourly",
    includedTasks: [
      "Multiple chore assistance (any combination)",
      "Sweeping, mopping, cooking vessel washing",
      "Laundry folding and ironing",
      "Grocery organization and pantry arrangement",
      "Elderly household assistance"
    ],
    excludedTasks: ["Specialized deep cleaning (book separately)", "Outdoor heavy-duty work"],
    isActive: true,
    sortOrder: 18
  },
  {
    serviceId: "srv_hourly_6hr",
    categoryId: "cat_hourly_maid",
    name: "Hourly Maid Help \u2014 6 Hours",
    description: "Full half-day maid service for comprehensive household assistance, cleaning and organization.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    price: 1099,
    duration: "6.0 hrs",
    rating: 4.9,
    reviewCount: 760,
    bookingType: "Hourly",
    includedTasks: [
      "Full home sweep, mop and dusting",
      "Dishwashing and kitchen cleanup",
      "Laundry washing, drying and folding",
      "Ironing up to 8 garments",
      "Grocery organization",
      "Any additional household chores"
    ],
    excludedTasks: ["Deep cleaning specialization", "Exterior outdoor heavy work"],
    isActive: true,
    sortOrder: 19
  }
];

export const SEED_USERS = {
  admin: {
    userId: "usr_admin_kleen",
    role: "admin",
    fullName: "KLEEN Executive Admin",
    email: "kleenadmin@gmail.com",
    username: "kleenadmin",
    phone: "+91 80000 11223",
    profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
    accountStatus: "ACTIVE"
  },
  partner: {
    userId: "usr_partner_sunita",
    partnerId: "usr_partner_sunita",
    role: "partner",
    fullName: "Sunita Verma",
    email: "partner@kleen.in",
    phone: "+91 98765 43210",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    dateOfBirth: "1994-05-12",
    gender: "Female",
    address: "TC 14/850, Kowdiar Main Road, Thiruvananthapuram, Kerala - 695003",
    city: "Thiruvananthapuram",
    district: "Thiruvananthapuram",
    state: "Kerala",
    pinCode: "695003",
    accountStatus: "ACTIVE",
    kycStatus: "UNDER_REVIEW",
    isEligibleForBooking: false,
    isOnline: false,
    rating: 4.9,
    totalRatings: 38,
    totalCompletedJobs: 42,
    totalEarnings: 24800,
    submittedAt: "2026-09-15T09:30:00.000Z",
    createdAt: "2026-01-10T08:30:00.000Z",
    idProofUrl: "https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&w=800&q=80",
    addressProofUrl: "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=800&q=80",
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
    bankDetails: {
      accountHolderName: "Sunita Verma",
      bankName: "State Bank of India",
      accountNumber: "38920194857",
      ifscCode: "SBIN0001234",
      accountType: "SAVINGS",
      upiId: "sunita.verma@oksbi",
      isVerified: true,
      updatedAt: "2026-09-15T10:00:00.000Z"
    }
  }
};

export const SEED_BOOKINGS = [];

export const SEED_OFFERS = [
  {
    offerId: "off_welcome50",
    name: "Welcome to KLEEN",
    code: "KLEEN50",
    discountType: "FLAT",
    discountValue: 50,
    minimumAmount: 399,
    maximumDiscount: 50,
    description: "Get flat \u20b950 off on your first home cleaning service",
    isActive: true
  },
  {
    offerId: "off_deepclean10",
    name: "Deep Clean Fest",
    code: "DEEPCLEAN10",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minimumAmount: 1499,
    maximumDiscount: 250,
    description: "Enjoy 10% off on all deep cleaning packages",
    isActive: true
  }
];

export const SEED_SETTINGS = {
  platformName: "KLEEN",
  tagline: "Professional On-Demand Maid & Home Care",
  currency: "INR",
  currencySymbol: "\u20b9",
  platformFee: 49,
  taxPercentage: 18,
  partnerCommissionRate: 20, // 20% platform commission, 80% to partner
  bookingEnabled: true,
  partnerRegistrationEnabled: true,
  cancellationWindowHours: 2,
  supportPhone: "1800-419-KLEEN",
  supportEmail: "care@kleen.in"
};
