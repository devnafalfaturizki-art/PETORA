import { supabase } from '@/lib/supabase';
import { AppError, ErrorCode } from '@/lib/errors';
import { MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES, SESSION_EXPIRY_HOURS } from '@/lib/constants';
import { loginCredentialsSchema, createUserSchema, updatePinSchema, resetPinSchema } from '@/schemas';
import type {
  SafeUser,
  LoginCredentials,
  LoginResponse,
  Session,
  CreateUserInput,
  UpdatePinInput,
  ResetPinInput,
  DeactivateUserInput,
} from '@/types/user';

export const AuthService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const validated = loginCredentialsSchema.parse(credentials);

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', validated.username)
      .single();

    if (fetchError || !user) {
      throw new AppError(
        ErrorCode.INVALID_CREDENTIALS,
        'Username atau PIN tidak valid'
      );
    }

    const userRow = user as unknown as SafeUser & {
      pin_hash: string;
      is_active: boolean;
      locked_until: string | null;
      failed_login_attempts: number;
    };

    if (userRow.locked_until && new Date(userRow.locked_until).getTime() > Date.now()) {
      throw new AppError(
        ErrorCode.ACCOUNT_LOCKED,
        'Akun Anda terkunci. Silakan coba lagi nanti.'
      );
    }

    if (!userRow.is_active) {
      throw new AppError(
        ErrorCode.ACCOUNT_INACTIVE,
        'Akun Anda tidak aktif. Hubungi administrator.'
      );
    }

    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: `${validated.username}@petora.local`,
      password: validated.pin,
    });

    if (signInError || !sessionData.session) {
      const attempts = (userRow.failed_login_attempts ?? 0) + 1;
      const updates: Record<string, unknown> = {
        failed_login_attempts: attempts,
      };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updates.locked_until = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
        ).toISOString();
      }
      await supabase.from('users').update(updates).eq('id', userRow.id);
      throw new AppError(
        ErrorCode.INVALID_CREDENTIALS,
        'Username atau PIN tidak valid'
      );
    }

    const safeUser: SafeUser = {
      id: userRow.id,
      username: userRow.username,
      role: userRow.role,
      full_name: userRow.full_name,
      customer_id: userRow.customer_id,
      created_by: userRow.created_by,
      failed_login_attempts: 0,
      locked_until: null,
      is_active: userRow.is_active,
      last_login_at: new Date().toISOString(),
      created_at: userRow.created_at,
      updated_at: userRow.updated_at,
    };

    await supabase
      .from('users')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', userRow.id);

    await supabase.from('audit_logs').insert({
      user_id: userRow.id,
      action: 'LOGIN',
      entity_type: 'users',
      entity_id: userRow.id,
    });

    const session: Session = {
      user_id: userRow.id,
      role: userRow.role,
      expires_at: new Date(
        Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
      ).toISOString(),
    };

    return {
      user: safeUser,
      session_token: sessionData.session.access_token,
      expires_at: session.expires_at,
    };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        `Logout failed: ${error.message}`
      );
    }
  },

  async changePin(
    input: UpdatePinInput,
    userId: string
  ): Promise<void> {
    updatePinSchema.parse(input);

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('pin_hash')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        'Pengguna tidak ditemukan'
      );
    }

    const userRow = user as unknown as { pin_hash: string };

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        'Sesi tidak valid'
      );
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: `${userRow.pin_hash}@petora.local`,
      password: input.old_pin,
    });

    if (verifyError) {
      throw new AppError(
        ErrorCode.INVALID_OLD_PIN,
        'PIN lama tidak valid'
      );
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        pin_hash: input.new_pin,
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', userId);

    if (updateError) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to update PIN: ${updateError.message}`
      );
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'CHANGE_PIN',
      entity_type: 'users',
      entity_id: userId,
    });
  },

  async resetPin(
    input: ResetPinInput,
    callerId: string
  ): Promise<void> {
    resetPinSchema.parse(input);

    const { data: caller, error: callerError } = await supabase
      .from('users')
      .select('role')
      .eq('id', callerId)
      .single();

    if (callerError || !caller) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Akses ditolak'
      );
    }

    const callerRole = (caller as { role: string }).role;

    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('*')
      .eq('id', input.target_user_id)
      .single();

    if (targetError || !targetUser) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        'Pengguna tidak ditemukan'
      );
    }

    const target = targetUser as unknown as { role: string };

    if (target.role !== 'CUSTOMER' && callerRole !== 'OWNER') {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Hanya Owner yang dapat mereset PIN staf'
      );
    }

    if (target.role === 'CUSTOMER' && callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Akses ditolak'
      );
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        pin_hash: input.new_pin,
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', input.target_user_id);

    if (updateError) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to reset PIN: ${updateError.message}`
      );
    }

    await supabase.from('audit_logs').insert({
      user_id: callerId,
      action: 'RESET_PIN',
      entity_type: 'users',
      entity_id: input.target_user_id,
      new_values: { reset_by: callerId },
    });
  },

  async createUser(
    input: CreateUserInput,
    callerId: string
  ): Promise<SafeUser> {
    createUserSchema.parse(input);

    const { data: caller, error: callerError } = await supabase
      .from('users')
      .select('role')
      .eq('id', callerId)
      .single();

    if (callerError || !caller) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Akses ditolak'
      );
    }

    const callerRole = (caller as { role: string }).role;

    if (input.role !== 'CUSTOMER' && callerRole !== 'OWNER') {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Hanya Owner yang dapat membuat akun staf'
      );
    }

    if (input.role === 'CUSTOMER' && callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Akses ditolak'
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('username', input.username)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        `Check username failed: ${existingError.message}`
      );
    }

    if (existing) {
      throw new AppError(
        ErrorCode.USERNAME_ALREADY_EXISTS,
        'Username sudah digunakan'
      );
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username: input.username,
        pin_hash: input.pin,
        role: input.role,
        full_name: input.full_name,
        customer_id: input.customer_id ?? null,
        created_by: callerId,
        failed_login_attempts: 0,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to create user: ${insertError.message}`
      );
    }

    const safeUser: SafeUser = {
      id: (newUser as { id: string }).id,
      username: (newUser as { username: string }).username,
      role: (newUser as { role: string }).role as SafeUser['role'],
      full_name: (newUser as { full_name: string }).full_name,
      customer_id: (newUser as { customer_id: string | null }).customer_id,
      created_by: (newUser as { created_by: string | null }).created_by,
      failed_login_attempts: (newUser as { failed_login_attempts: number }).failed_login_attempts,
      locked_until: (newUser as { locked_until: string | null }).locked_until,
      is_active: (newUser as { is_active: boolean }).is_active,
      last_login_at: (newUser as { last_login_at: string | null }).last_login_at,
      created_at: (newUser as { created_at: string }).created_at,
      updated_at: (newUser as { updated_at: string }).updated_at,
    };

    await supabase.from('audit_logs').insert({
      user_id: callerId,
      action: 'CREATE_USER',
      entity_type: 'users',
      entity_id: safeUser.id,
      new_values: { username: safeUser.username, role: safeUser.role, created_by: callerId },
    });

    return safeUser;
  },

  async deactivateUser(
    input: DeactivateUserInput,
    callerId: string
  ): Promise<void> {
    const { data: caller, error: callerError } = await supabase
      .from('users')
      .select('role')
      .eq('id', callerId)
      .single();

    if (callerError || !caller) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Akses ditolak'
      );
    }

    const callerRole = (caller as { role: string }).role;

    const { data: target, error: targetError } = await supabase
      .from('users')
      .select('role')
      .eq('id', input.user_id)
      .single();

    if (targetError || !target) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        'Pengguna tidak ditemukan'
      );
    }

    const targetRole = (target as { role: string }).role;

    if (targetRole !== 'CUSTOMER' && callerRole !== 'OWNER') {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Hanya Owner yang dapat menonaktifkan akun staf'
      );
    }

    if (targetRole === 'CUSTOMER' && callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Akses ditolak'
      );
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', input.user_id);

    if (updateError) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to deactivate user: ${updateError.message}`
      );
    }

    await supabase.from('audit_logs').insert({
      user_id: callerId,
      action: 'DEACTIVATE_USER',
      entity_type: 'users',
      entity_id: input.user_id,
      old_values: { reason: input.reason ?? null },
      new_values: { is_active: false },
    });
  },

  getCurrentUser: (): SafeUser | null => {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem('petora-auth');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as {
        user: SafeUser;
        session: Session;
      };
      const sessionValid =
        parsed.session &&
        new Date(parsed.session.expires_at).getTime() > Date.now();
      return sessionValid ? parsed.user : null;
    } catch {
      return null;
    }
  },
};

export default AuthService;
