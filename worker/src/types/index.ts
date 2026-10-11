export interface Bindings {
  DB: D1Database;
  ASSETS?: Fetcher;
  APP_ENV?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}
export type AppEnv = { Bindings: Bindings; Variables: { requestId: string } };
