import { Config } from "../types";

export const defaults: Required<
  Pick<Config, "grayBand" | "cacheTtlMs" | "piiPolicy">
> &
  Config = {
  grayBand: [45, 65],
  piiPolicy: "hash-local",
  cacheTtlMs: 24 * 60 * 60 * 1000, // 24 hours
};

export function withDefaults(cfg: Partial<Config> = {}): Config {
  return { ...defaults, ...cfg };
}
