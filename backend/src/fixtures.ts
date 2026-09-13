export const release = {
  id: "release-csv-export",
  environment: "production",
  status: "success",
  evidence: "Manual CSV export is now available on all plans. Users can download a report from the dashboard. Scheduled exports and automatic email delivery are not included.",
};

export type Customer = {
  id: string;
  feedback: string | null;
  status: "canceled" | "active";
  marketingConsent: boolean;
  contactedReleaseIds: string[];
};

export const customers: Customer[] = [
  {
    id: "customer-manual-csv",
    feedback: "I canceled because I cannot download my reports as CSV files. I need to open them in Excel.",
    status: "canceled",
    marketingConsent: true,
    contactedReleaseIds: [],
  },
  {
    id: "customer-scheduled-csv",
    feedback: "I need a CSV report emailed to my team automatically every Monday. Manual downloads do not work for us.",
    status: "canceled",
    marketingConsent: true,
    contactedReleaseIds: [],
  },
  {
    id: "customer-price",
    feedback: "The subscription costs too much for our small team.",
    status: "canceled",
    marketingConsent: true,
    contactedReleaseIds: [],
  },
  {
    id: "customer-unknown",
    feedback: null,
    status: "canceled",
    marketingConsent: true,
    contactedReleaseIds: [],
  },
  {
    id: "customer-opted-out",
    feedback: "I need CSV downloads.",
    status: "canceled",
    marketingConsent: false,
    contactedReleaseIds: [],
  },
];
