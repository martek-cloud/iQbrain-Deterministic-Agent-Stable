import bcrypt from 'bcryptjs';

export interface User {
  username: string;
  passwordHash: string;
  displayName: string;
}

// ---------------------------------------------------------------------------
// Default dev account: admin / iqbrain2025
// Override by setting AUTH_USERS env var as a JSON array:
//   [{"username":"alice","password":"secret","displayName":"Alice"}]
// ---------------------------------------------------------------------------
function buildUserStore(): Map<string, User> {
  const store = new Map<string, User>();

  // Try custom users from env
  const raw = process.env.AUTH_USERS;
  if (raw) {
    try {
      const list = JSON.parse(raw) as Array<{ username: string; password: string; displayName?: string }>;
      for (const u of list) {
        const passwordHash = bcrypt.hashSync(u.password, 10);
        store.set(u.username.toLowerCase(), { username: u.username, passwordHash, displayName: u.displayName ?? u.username });
      }
      console.log(`[auth] Loaded ${store.size} user(s) from AUTH_USERS env`);
      return store;
    } catch {
      console.warn('[auth] Failed to parse AUTH_USERS env — falling back to default account');
    }
  }

  // Default dev account
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? 'iqbrain2025';
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);
  store.set('admin', { username: 'admin', passwordHash, displayName: 'Admin' });
  console.log('[auth] Using default dev account: admin / iqbrain2025');
  return store;
}

const USERS = buildUserStore();

export function findUser(username: string): User | undefined {
  return USERS.get(username.toLowerCase());
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}
