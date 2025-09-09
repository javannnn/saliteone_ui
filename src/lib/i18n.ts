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
    schools: "Schools"
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
    schools: "ትምህርት ቤቶች"
  }
} as const;

export function t<K extends keyof typeof dict["en"]>(key: K, locale: Locale) {
  return dict[locale][key];
}

