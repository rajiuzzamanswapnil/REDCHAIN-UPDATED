export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const MALAYSIA_LOCATIONS = {
  Johor: ["Johor Bahru", "Batu Pahat", "Kluang", "Muar", "Pasir Gudang", "Segamat"],
  Kedah: ["Alor Setar", "Sungai Petani", "Kulim", "Langkawi"],
  Kelantan: ["Kota Bharu", "Pasir Mas", "Tanah Merah"],
  Melaka: ["Melaka City", "Alor Gajah", "Jasin"],
  "Negeri Sembilan": ["Seremban", "Port Dickson", "Nilai", "Kuala Pilah"],
  Pahang: ["Kuantan", "Temerloh", "Bentong", "Cameron Highlands"],
  Penang: ["George Town", "Butterworth", "Bukit Mertajam", "Bayan Lepas"],
  Perak: ["Ipoh", "Taiping", "Teluk Intan", "Sitiawan"],
  Perlis: ["Kangar", "Arau"],
  Sabah: ["Kota Kinabalu", "Sandakan", "Tawau", "Lahad Datu"],
  Sarawak: ["Kuching", "Miri", "Sibu", "Bintulu"],
  Selangor: ["Shah Alam", "Petaling Jaya", "Subang Jaya", "Klang", "Kajang", "Cyberjaya", "Seri Kembangan"],
  Terengganu: ["Kuala Terengganu", "Kemaman", "Dungun"],
  "Kuala Lumpur": ["Kuala Lumpur", "Cheras", "Setapak", "Bangsar", "Bukit Jalil"],
  Labuan: ["Victoria"],
  Putrajaya: ["Putrajaya"],
};

export const MALAYSIA_STATES = Object.keys(MALAYSIA_LOCATIONS);

export const REQUEST_COMPONENTS = [
  "Whole Blood",
  "Red Blood Cells",
  "Platelets",
  "Plasma",
  "Cryoprecipitate",
  "Not specified by hospital",
];

export const URGENCY_LEVELS = ["critical", "high", "medium", "low"];
export const ACCOUNT_TYPES = ["donor", "recipient", "organization"];
export const CONTACT_PREFERENCES = ["phone", "email", "whatsapp"];

export const DONATION_ELIGIBILITY_NOTICE =
  "Registration does not confirm medical eligibility. The hospital or authorised blood centre must complete final donor screening and compatibility checks.";
