export type Release = {
  id: string;
  environment: string;
  status: string;
  evidence: string;
};

export type Customer = {
  id: string;
  feedback: string | null;
  status: "canceled" | "active";
  marketingConsent: boolean;
  contactedReleaseIds: string[];
};
