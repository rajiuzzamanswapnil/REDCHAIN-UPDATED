export function formatDate(value, includeTime = false) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function timeAgo(value) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function initials(name = "User") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export function maskEmail(email = "") {
  const [name, domain] = email.split("@");
  if (!domain) return "Private";
  return `${name?.slice(0, 2) || "**"}***@${domain}`;
}

export function maskPhone(phone = "") {
  if (!phone) return "Private";
  const clean = phone.replace(/\s/g, "");
  return `${clean.slice(0, 4)}****${clean.slice(-2)}`;
}

export function profileCompletion(profile, privateProfile, donorProfile) {
  const fields = [
    profile?.display_name,
    profile?.state,
    profile?.city,
    privateProfile?.full_name,
    privateProfile?.phone,
    privateProfile?.contact_preference,
  ];
  if (profile?.account_type === "donor") {
    fields.push(donorProfile?.blood_group, donorProfile?.medical_declaration);
  }
  const complete = fields.filter(Boolean).length;
  return Math.round((complete / fields.length) * 100);
}

export function sanitizeFileName(name = "document") {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function statusTone(status = "") {
  const value = status.toLowerCase();
  if (["verified", "approved", "active", "open", "completed", "fulfilled", "accepted", "available"].includes(value)) return "green";
  if (["pending", "offered", "matched", "under_review"].includes(value)) return "amber";
  if (["critical", "rejected", "cancelled", "suspended", "declined"].includes(value)) return "red";
  if (["high", "admin"].includes(value)) return "purple";
  if (["medium", "recipient", "organization"].includes(value)) return "blue";
  return "gray";
}

export function requestLocation(request) {
  return [request?.hospital_city, request?.hospital_state].filter(Boolean).join(", ");
}

export function readableError(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  const message = error.message || String(error);
  if (message.includes("duplicate key")) return "This record already exists.";
  if (message.includes("row-level security")) return "You do not have permission to perform this action.";
  if (message.includes("Invalid login credentials")) return "Incorrect email or password.";
  return message;
}
