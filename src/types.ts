export type FieldValue = string | number | boolean | null;

export type FieldDescriptor = {
  key: string;
  type?:
    | "email"
    | "phone"
    | "url"
    | "name"
    | "company"
    | "message"
    | "location"
    | `custom:${string}`;
  required?: boolean;
};

export type Submission = {
  email?: string;
  name?: string;
  message?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  timestampMs?: number;
  renderedAtMs?: number;
  fields?: Record<string, FieldValue>;
  descriptors?: FieldDescriptor[];
};

export type Decision = {
  action: "allow" | "review" | "block";
  score: number;
  reasons: string[];
  details?: Record<string, any>;
};

export type ProviderResult = {
  label: "human" | "spam";
  confidence: number;
  reasons?: string[];
  provider?: string;
};

export type AiProvider = {
  id: string;
  classify(input: {
    emailHash?: string;
    domain?: string;
    message?: string;
    ua?: string;
    url?: string;
    fields?: Record<string, FieldValue>;
  }): Promise<ProviderResult>;
};

export type RouterStrategy =
  | { mode: "none" }
  | { mode: "first-available"; order: string[] }
  | { mode: "fallback"; primary: string; secondary: string }
  | { mode: "vote"; members: string[]; minAgree?: number }
  | { mode: "blend"; members: { id: string; weight?: number }[] }
  | { mode: "canary"; control: string; candidate: string; pct: number }
  | { mode: "ab"; a: string; b: string; salt?: string };

export type RuleContext = Submission & { normalized: Record<string, string> };

export type Rule = (ctx: RuleContext) => Partial<Decision> | null | undefined;

export type Config = {
  enableMxCheck?: boolean;
  grayBand?: [number, number];
  tldRisk?: Record<string, number>;
  disposableDomains?: string[];
  allowDomains?: string[];
  blockDomains?: string[];
  allowEmailsHashed?: string[];
  blockEmailsHashed?: string[];
  blockKeywords?: string[];
  customRules?: Rule[];
  piiPolicy?: "hash-local" | "plain";
  cacheTtlMs?: number;
  aiProviders?: AiProvider[];
  router?: RouterStrategy;
  aiBudget?: { perRequestUsd?: number; rollingUsd?: number };
};
