import type { Locale } from "@/stores/ui";

const dict = {
  en: {
    dashboard: "Dashboard",
    processes: "Processes",
    approvals: "Pending Approvals",
    my_tasks: "My Open Tasks",
    recent: "Recent Activity",
    create: "Create",
    cancel: "Cancel",
    language: "Language",
    members: "Members",
    payments: "Payments",
    sponsorships: "Sponsorships",
    newcomers: "Newcomers",
    volunteers: "Volunteers",
    media: "Media",
    schools: "Schools",
    notifications: "Notifications",
    mark_read: "Mark as read",
    mark_all_read: "Mark all as read",
    status_active: "Active",
    status_pending: "Pending",
    status_lapsed: "Lapsed",
    actions_save: "Save",
    actions_cancel: "Cancel",
    actions_approve: "Approve",
    actions_reject: "Reject",
  },
  am: {
    dashboard: "ዳሽቦርድ",
    processes: "ሂደቶች",
    approvals: "በመጠባበቅ ያሉ ማፅደቃዎች",
    my_tasks: "የእኔ ክፍት ተግባሮች",
    recent: "የቅርብ እንቅስቃሴ",
    create: "ፍጠር",
    cancel: "ሰርዝ",
    language: "ቋንቋ",
    members: "አባላት",
    payments: "ክፍያዎች",
    sponsorships: "ድጋፎች",
    newcomers: "አዳዲስ መጣቶች",
    volunteers: "በጎ ፈቃደኞች",
    media: "ሚዲያ",
    schools: "ትምህርት ቤቶች",
    notifications: "ማስታወቂያዎች",
    mark_read: "እንደ ተነበበ ምል",
    mark_all_read: "ሁሉንም አንብቤዋለሁ",
    status_active: "ንቁ",
    status_pending: "በመጠባበቅ",
    status_lapsed: "ያቋረጠ",
    actions_save: "አስቀምጥ",
    actions_cancel: "ሰርዝ",
    actions_approve: "አጽድቅ",
    actions_reject: "አለቀስ",
  }
} as const;

export function t<K extends keyof typeof dict["en"]>(key: K, locale: Locale) {
  return dict[locale][key];
}

export function tSafe(key: string, locale: Locale, fallback?: string) {
  const table = dict[locale] as Record<string, string>;
  return table[key] || fallback || key;
}
