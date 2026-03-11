import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  isTenantAdmin: boolean;
  isPlatformAdmin: boolean;
  /** Set when TOTP is required but not yet verified */
  pendingTotpVerification?: boolean;
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || 'CHANGE_ME_min_32_chars_random_string_for_dev',
  cookieName: 'drk-kennwort-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 8 * 60 * 60, // 8 hours
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
