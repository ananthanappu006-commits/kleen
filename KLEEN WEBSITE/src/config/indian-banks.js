/**
 * KLEEN — Indian Banks Catalog & SVG Vector Logos
 * Comprehensive directory of all major Indian Public, Private, Regional, and Small Finance Banks.
 */

export const INDIAN_BANKS = [
  // ─── TOP / POPULAR INDIAN & KERALA BANKS ───
  {
    id: "sbi",
    name: "State Bank of India",
    shortCode: "SBI",
    ifscPrefix: "SBIN",
    category: "Public Sector",
    isPopular: true,
    color: "#280071",
    bgColor: "#EEF2FF",
    textColor: "#1E1B4B",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#280071"/>
      <circle cx="20" cy="20" r="12" fill="#00A5EC"/>
      <circle cx="20" cy="20" r="4.5" fill="#280071"/>
      <rect x="18.5" y="20" width="3" height="12" fill="#280071"/>
    </svg>`
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    shortCode: "HDFC",
    ifscPrefix: "HDFC",
    category: "Private Sector",
    isPopular: true,
    color: "#004C8F",
    bgColor: "#EFF6FF",
    textColor: "#1E3A8A",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#004C8F"/>
      <rect x="10" y="10" width="20" height="20" fill="#ED232A"/>
      <rect x="15" y="15" width="10" height="10" fill="#FFFFFF"/>
      <rect x="18.5" y="12" width="3" height="16" fill="#004C8F"/>
      <rect x="12" y="18.5" width="16" height="3" fill="#004C8F"/>
    </svg>`
  },
  {
    id: "icici",
    name: "ICICI Bank",
    shortCode: "ICICI",
    ifscPrefix: "ICIC",
    category: "Private Sector",
    isPopular: true,
    color: "#B02A30",
    bgColor: "#FFF1F2",
    textColor: "#881337",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#B02A30"/>
      <circle cx="16" cy="20" r="8" stroke="#F58220" stroke-width="3" fill="none"/>
      <circle cx="24" cy="20" r="8" stroke="#FFFFFF" stroke-width="3" fill="none"/>
      <circle cx="20" cy="20" r="3.5" fill="#F58220"/>
    </svg>`
  },
  {
    id: "axis",
    name: "Axis Bank",
    shortCode: "AXIS",
    ifscPrefix: "UTIB",
    category: "Private Sector",
    isPopular: true,
    color: "#861F41",
    bgColor: "#FDF2F8",
    textColor: "#701A75",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#861F41"/>
      <path d="M20 9L29 27H23.5L20 18.5L16.5 27H11L20 9Z" fill="#FFFFFF"/>
      <path d="M20 23L22.5 28H17.5L20 23Z" fill="#FFB81C"/>
    </svg>`
  },
  {
    id: "federal",
    name: "Federal Bank",
    shortCode: "FEDERAL",
    ifscPrefix: "FDRL",
    category: "Private Sector",
    isPopular: true,
    color: "#003A70",
    bgColor: "#F0F7FF",
    textColor: "#003A70",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#003A70"/>
      <path d="M12 12H28V16H17V20H25V24H17V28H12V12Z" fill="#FFA300"/>
      <circle cx="26" cy="26" r="3" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: "kerala_gramin",
    name: "Kerala Gramin Bank",
    shortCode: "KGB",
    ifscPrefix: "KLGB",
    category: "Regional Rural",
    isPopular: true,
    color: "#0F766E",
    bgColor: "#F0FDFA",
    textColor: "#115E59",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0F766E"/>
      <circle cx="20" cy="20" r="11" stroke="#FDE047" stroke-width="2.5" fill="none"/>
      <path d="M15 25L20 13L25 25H21.5L20 18L18.5 25H15Z" fill="#FFFFFF"/>
      <path d="M14 27C17 29 23 29 26 27" stroke="#FDE047" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },

  // ─── MAJOR PUBLIC SECTOR BANKS ───
  {
    id: "pnb",
    name: "Punjab National Bank",
    shortCode: "PNB",
    ifscPrefix: "PUNB",
    category: "Public Sector",
    color: "#A20034",
    bgColor: "#FFF1F2",
    textColor: "#9F1239",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#A20034"/>
      <circle cx="20" cy="20" r="10" stroke="#FFC72C" stroke-width="3" fill="none"/>
      <circle cx="20" cy="20" r="4.5" fill="#FFC72C"/>
    </svg>`
  },
  {
    id: "canara",
    name: "Canara Bank",
    shortCode: "CANARA",
    ifscPrefix: "CNRB",
    category: "Public Sector",
    color: "#0091DA",
    bgColor: "#F0F9FF",
    textColor: "#0369A1",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0091DA"/>
      <path d="M11 27L20 11L29 27H11Z" fill="#FFD100"/>
      <path d="M15 27L20 17L25 27H15Z" fill="#0091DA"/>
    </svg>`
  },
  {
    id: "bob",
    name: "Bank of Baroda",
    shortCode: "BOB",
    ifscPrefix: "BARB",
    category: "Public Sector",
    color: "#F26522",
    bgColor: "#FFF7ED",
    textColor: "#C2410C",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#F26522"/>
      <circle cx="17" cy="20" r="7" fill="#FFFFFF"/>
      <circle cx="24" cy="20" r="7" fill="#FFFFFF" fill-opacity="0.75"/>
    </svg>`
  },
  {
    id: "union",
    name: "Union Bank of India",
    shortCode: "UNION",
    ifscPrefix: "UBIN",
    category: "Public Sector",
    color: "#004B87",
    bgColor: "#EFF6FF",
    textColor: "#1E40AF",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#004B87"/>
      <path d="M13 13H18V21C18 23 19 24 20 24C21 24 22 23 22 21V13H27V21C27 25 24 28 20 28C16 28 13 25 13 21V13Z" fill="#ED1C24"/>
    </svg>`
  },
  {
    id: "boi",
    name: "Bank of India",
    shortCode: "BOI",
    ifscPrefix: "BKID",
    category: "Public Sector",
    color: "#E85D04",
    bgColor: "#FFF7ED",
    textColor: "#9A3412",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#E85D04"/>
      <polygon points="20,10 23,17 30,17 24,22 26,29 20,25 14,29 16,22 10,17 17,17" fill="#FFDD00"/>
    </svg>`
  },
  {
    id: "indian_bank",
    name: "Indian Bank",
    shortCode: "INDIAN",
    ifscPrefix: "IDIB",
    category: "Public Sector",
    color: "#005BA6",
    bgColor: "#EFF6FF",
    textColor: "#1D4ED8",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#005BA6"/>
      <circle cx="20" cy="20" r="10" fill="#E31837"/>
      <rect x="18" y="14" width="4" height="12" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: "cbi",
    name: "Central Bank of India",
    shortCode: "CBI",
    ifscPrefix: "CBIN",
    category: "Public Sector",
    color: "#004080",
    bgColor: "#EFF6FF",
    textColor: "#1E3A8A",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#004080"/>
      <circle cx="20" cy="20" r="10" stroke="#FF8C00" stroke-width="3" fill="none"/>
      <text x="20" y="24" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF" font-family="sans-serif">C</text>
    </svg>`
  },
  {
    id: "iob",
    name: "Indian Overseas Bank",
    shortCode: "IOB",
    ifscPrefix: "IOBA",
    category: "Public Sector",
    color: "#002B49",
    bgColor: "#F1F5F9",
    textColor: "#0F172A",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#002B49"/>
      <circle cx="20" cy="20" r="9" stroke="#E31837" stroke-width="2.5" fill="none"/>
      <rect x="18.5" y="15" width="3" height="10" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: "uco",
    name: "UCO Bank",
    shortCode: "UCO",
    ifscPrefix: "UCBA",
    category: "Public Sector",
    color: "#0067A5",
    bgColor: "#F0F9FF",
    textColor: "#0369A1",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0067A5"/>
      <path d="M14 14H18V21C18 22.5 19 23 20 23C21 23 22 22.5 22 21V14H26V21C26 24.5 23.5 26.5 20 26.5C16.5 26.5 14 24.5 14 21V14Z" fill="#F8B124"/>
    </svg>`
  },
  {
    id: "bom",
    name: "Bank of Maharashtra",
    shortCode: "BOM",
    ifscPrefix: "MAHB",
    category: "Public Sector",
    color: "#1E3A8A",
    bgColor: "#EFF6FF",
    textColor: "#1E40AF",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1E3A8A"/>
      <path d="M12 28L20 12L28 28H12Z" stroke="#F59E0B" stroke-width="2.5" fill="none"/>
      <circle cx="20" cy="23" r="2.5" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: "psb",
    name: "Punjab & Sind Bank",
    shortCode: "PSB",
    ifscPrefix: "PSIB",
    category: "Public Sector",
    color: "#1B4D3E",
    bgColor: "#F0FDF4",
    textColor: "#166534",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1B4D3E"/>
      <circle cx="20" cy="20" r="10" stroke="#FFBF00" stroke-width="3" fill="none"/>
      <rect x="18.5" y="15" width="3" height="10" fill="#FFBF00"/>
    </svg>`
  },

  // ─── MAJOR PRIVATE SECTOR BANKS ───
  {
    id: "kotak",
    name: "Kotak Mahindra Bank",
    shortCode: "KOTAK",
    ifscPrefix: "KKBK",
    category: "Private Sector",
    color: "#ED1C24",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#ED1C24"/>
      <path d="M13 14H18L24 20L18 26H13L19 20L13 14Z" fill="#FFFFFF"/>
      <path d="M21 14H26L28 16V24L26 26H21L23 24V16L21 14Z" fill="#1E3A8A"/>
    </svg>`
  },
  {
    id: "indusind",
    name: "IndusInd Bank",
    shortCode: "INDUSIND",
    ifscPrefix: "INDB",
    category: "Private Sector",
    color: "#8B0000",
    bgColor: "#FEF2F2",
    textColor: "#7F1D1D",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#8B0000"/>
      <circle cx="20" cy="20" r="10" stroke="#FFFFFF" stroke-width="2" fill="none"/>
      <text x="20" y="24" text-anchor="middle" font-size="11" font-weight="800" fill="#FFFFFF" font-family="sans-serif">I</text>
    </svg>`
  },
  {
    id: "yes_bank",
    name: "Yes Bank",
    shortCode: "YES",
    ifscPrefix: "YESB",
    category: "Private Sector",
    color: "#0B4EA2",
    bgColor: "#EFF6FF",
    textColor: "#1D4ED8",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0B4EA2"/>
      <path d="M12 14L20 22L28 14" stroke="#EE2E24" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M20 22V27" stroke="#EE2E24" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: "idfc",
    name: "IDFC FIRST Bank",
    shortCode: "IDFC",
    ifscPrefix: "IDFB",
    category: "Private Sector",
    color: "#991B1E",
    bgColor: "#FFF1F2",
    textColor: "#9F1239",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#991B1E"/>
      <rect x="12" y="12" width="16" height="16" rx="4" stroke="#FFFFFF" stroke-width="2" fill="none"/>
      <text x="20" y="24" text-anchor="middle" font-size="10" font-weight="900" fill="#FFFFFF" font-family="sans-serif">1st</text>
    </svg>`
  },
  {
    id: "south_indian",
    name: "South Indian Bank",
    shortCode: "SIB",
    ifscPrefix: "SIBL",
    category: "Private Sector",
    color: "#C5202F",
    bgColor: "#FFF1F2",
    textColor: "#9F1239",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#C5202F"/>
      <circle cx="20" cy="20" r="10" stroke="#FFC72C" stroke-width="2" fill="none"/>
      <text x="20" y="24" text-anchor="middle" font-size="10" font-weight="900" fill="#FFFFFF" font-family="sans-serif">SIB</text>
    </svg>`
  },
  {
    id: "bandhan",
    name: "Bandhan Bank",
    shortCode: "BANDHAN",
    ifscPrefix: "BDBL",
    category: "Private Sector",
    color: "#D32F2F",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#D32F2F"/>
      <circle cx="20" cy="20" r="9" stroke="#FFA000" stroke-width="2.5" fill="none"/>
      <path d="M16 20H24" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: "rbl",
    name: "RBL Bank",
    shortCode: "RBL",
    ifscPrefix: "RATN",
    category: "Private Sector",
    color: "#1A365D",
    bgColor: "#F1F5F9",
    textColor: "#0F172A",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1A365D"/>
      <circle cx="20" cy="20" r="10" fill="#0099DA"/>
      <circle cx="20" cy="20" r="5" fill="#E31837"/>
    </svg>`
  },
  {
    id: "city_union",
    name: "City Union Bank",
    shortCode: "CUB",
    ifscPrefix: "CIUB",
    category: "Private Sector",
    color: "#004B87",
    bgColor: "#EFF6FF",
    textColor: "#1E40AF",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#004B87"/>
      <circle cx="20" cy="20" r="9" stroke="#FFBF00" stroke-width="2.5" fill="none"/>
      <text x="20" y="24" text-anchor="middle" font-size="9" font-weight="900" fill="#FFFFFF" font-family="sans-serif">CUB</text>
    </svg>`
  },
  {
    id: "karur_vysya",
    name: "Karur Vysya Bank",
    shortCode: "KVB",
    ifscPrefix: "KVBL",
    category: "Private Sector",
    color: "#8B1E41",
    bgColor: "#FDF2F8",
    textColor: "#831843",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#8B1E41"/>
      <circle cx="20" cy="20" r="10" stroke="#FFD100" stroke-width="2.5" fill="none"/>
      <text x="20" y="24" text-anchor="middle" font-size="9" font-weight="900" fill="#FFFFFF" font-family="sans-serif">KVB</text>
    </svg>`
  },
  {
    id: "csb",
    name: "CSB Bank",
    shortCode: "CSB",
    ifscPrefix: "CSBK",
    category: "Private Sector",
    color: "#E53E3E",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#E53E3E"/>
      <circle cx="20" cy="20" r="10" stroke="#FFFFFF" stroke-width="2.5" fill="none"/>
      <text x="20" y="24" text-anchor="middle" font-size="9" font-weight="900" fill="#FFFFFF" font-family="sans-serif">CSB</text>
    </svg>`
  },
  {
    id: "dhanlaxmi",
    name: "Dhanlaxmi Bank",
    shortCode: "DHANLAXMI",
    ifscPrefix: "DLXB",
    category: "Private Sector",
    color: "#B45309",
    bgColor: "#FEF3C7",
    textColor: "#92400E",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#B45309"/>
      <circle cx="20" cy="20" r="10" stroke="#FDE047" stroke-width="2" fill="none"/>
      <path d="M20 13V27M16 16H24M16 24H24" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: "jk_bank",
    name: "Jammu & Kashmir Bank",
    shortCode: "JKB",
    ifscPrefix: "JAKA",
    category: "Private Sector",
    color: "#0369A1",
    bgColor: "#F0F9FF",
    textColor: "#075985",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0369A1"/>
      <polygon points="20,11 28,26 12,26" stroke="#FFFFFF" stroke-width="2" fill="none"/>
      <circle cx="20" cy="21" r="3" fill="#FDE047"/>
    </svg>`
  },
  {
    id: "karnataka_bank",
    name: "Karnataka Bank",
    shortCode: "KTK",
    ifscPrefix: "KARB",
    category: "Private Sector",
    color: "#B91C1C",
    bgColor: "#FEF2F2",
    textColor: "#7F1D1D",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#B91C1C"/>
      <circle cx="20" cy="20" r="10" stroke="#FACC15" stroke-width="2" fill="none"/>
      <text x="20" y="24" text-anchor="middle" font-size="9" font-weight="900" fill="#FFFFFF" font-family="sans-serif">KTK</text>
    </svg>`
  },

  // ─── SMALL FINANCE & PAYMENTS BANKS ───
  {
    id: "au_sf",
    name: "AU Small Finance Bank",
    shortCode: "AU",
    ifscPrefix: "AUBL",
    category: "Small Finance",
    color: "#6D28D9",
    bgColor: "#F5F3FF",
    textColor: "#5B21B6",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#6D28D9"/>
      <circle cx="20" cy="20" r="10" fill="#F97316"/>
      <text x="20" y="24" text-anchor="middle" font-size="10" font-weight="900" fill="#FFFFFF" font-family="sans-serif">AU</text>
    </svg>`
  },
  {
    id: "equitas",
    name: "Equitas Small Finance Bank",
    shortCode: "EQUITAS",
    ifscPrefix: "ESFB",
    category: "Small Finance",
    color: "#1E3A8A",
    bgColor: "#EFF6FF",
    textColor: "#1D4ED8",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1E3A8A"/>
      <circle cx="20" cy="20" r="9" stroke="#60A5FA" stroke-width="2.5" fill="none"/>
      <circle cx="20" cy="20" r="4" fill="#3B82F6"/>
    </svg>`
  },
  {
    id: "paytm_bank",
    name: "Paytm Payments Bank",
    shortCode: "PAYTM",
    ifscPrefix: "PYTM",
    category: "Payments Bank",
    color: "#00BAF2",
    bgColor: "#F0FDF4",
    textColor: "#0369A1",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#002E6E"/>
      <circle cx="20" cy="20" r="10" fill="#00BAF2"/>
      <text x="20" y="24" text-anchor="middle" font-size="8" font-weight="900" fill="#FFFFFF" font-family="sans-serif">PAY</text>
    </svg>`
  },
  {
    id: "airtel_bank",
    name: "Airtel Payments Bank",
    shortCode: "AIRTEL",
    ifscPrefix: "AIRP",
    category: "Payments Bank",
    color: "#DC2626",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#DC2626"/>
      <path d="M14 26C14 18 19 14 20 14C21 14 26 18 26 26" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <circle cx="20" cy="20" r="2.5" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: "ippb",
    name: "India Post Payments Bank",
    shortCode: "IPPB",
    ifscPrefix: "IPOS",
    category: "Payments Bank",
    color: "#DC2626",
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    logoSvg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#B91C1C"/>
      <rect x="12" y="14" width="16" height="12" rx="2" stroke="#FDE047" stroke-width="2" fill="none"/>
      <path d="M12 16L20 21L28 16" stroke="#FDE047" stroke-width="2"/>
    </svg>`
  }
];

export const POPULAR_BANKS = INDIAN_BANKS.filter(b => !!b.isPopular);

/**
 * Filter banks by query string (matches name, short code, or IFSC prefix)
 */
export function searchBanks(query = "") {
  if (!query || !query.trim()) return INDIAN_BANKS;
  const q = query.trim().toLowerCase();
  return INDIAN_BANKS.filter(b => 
    b.name.toLowerCase().includes(q) ||
    b.shortCode.toLowerCase().includes(q) ||
    b.ifscPrefix.toLowerCase().includes(q) ||
    b.category.toLowerCase().includes(q)
  );
}

/**
 * Lookup bank by ID or Name
 */
export function findBank(idOrName) {
  if (!idOrName) return null;
  const target = String(idOrName).toLowerCase().trim();
  return INDIAN_BANKS.find(b => 
    b.id.toLowerCase() === target ||
    b.name.toLowerCase() === target ||
    b.shortCode.toLowerCase() === target
  ) || null;
}
