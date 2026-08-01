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
  account: {
    // Without a `database`, better-auth force-enables this
    // (context/create-context.mjs: `if (!options.database) ... storeAccountCookie: true`),
    // which writes the GitHub access AND refresh token into a client-side
    // `better-auth.account_data` cookie for 7 days. It's JWE-encrypted with a
    // key derived from BETTER_AUTH_SECRET, so it isn't readable by the client
    // — but this app never calls the GitHub API. It only ever reads
    // session.user.{login,name,email,image}. Shipping token material we have
    // no use for is unnecessary attack surface (OWASP A04, data minimisation),
    // so turn it off. An explicit `false` correctly overrides the forced
    // default, since better-auth merges with defu, which only fills in
    // undefined/null.
    storeAccountCookie: false,
  },
  // These routes exist purely to hand a provider token back to the caller.
  // /get-access-token decrypts the account cookie server-side and returns the
  // raw access token as JSON to anyone holding a valid session cookie — a
  // decrypt-on-demand oracle that turns a stolen session into a usable GitHub
  // token. Nothing in this app calls them. Disabling them means that even if
  // storeAccountCookie is ever flipped back on, a session compromise can't be
  // escalated into a GitHub token.
  disabledPaths: ["/get-access-token", "/refresh-token"],
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
      // `input: true` (the default) is required here: better-auth silently
      // drops provider-mapped values for any field marked `input: false`
      // during OAuth sign-in (it treats that flag as "server-owned, ignore
      // client/provider-supplied values"), which left session.user.login
      // undefined and broke the /profile gate. There's no email/password
      // provider registered, so nothing else can set this field.
      login: { type: "string", required: false },
    },
  },
  plugins: [nextCookies()], // keep last
});

export type Session = typeof auth.$Infer.Session;
