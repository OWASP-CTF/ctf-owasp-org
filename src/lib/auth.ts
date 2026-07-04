import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

/**
 * Stateless better-auth instance: no `database` key, so sessions live entirely
 * in signed/encrypted cookies. The only persistent backend this app has is a
 * read-only Upstash token, so there is nowhere to put user/session tables —
 * and for a weekend event, cookie sessions are all we need. Bump
 * `session.cookieCache.version` to force-invalidate every session at once.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // survive the whole con weekend
      strategy: "jwe",
      refreshCache: true,
      version: "1",
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // The GitHub login is the leaderboard row key (the scorer records the
      // PR author's login), so capture it — name/email/image aren't enough.
      mapProfileToUser: (profile) => ({ login: profile.login }),
    },
  },
  user: {
    additionalFields: {
      login: { type: "string", required: false, input: false },
    },
  },
  plugins: [nextCookies()], // keep last
});

export type Session = typeof auth.$Infer.Session;
