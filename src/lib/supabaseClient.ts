import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Access Supabase variables from Vite VITE_ prefix, or fall back to standard process.env structure
const supabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Check if variables are valid and not placeholders
export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder-project') && 
  !supabaseAnonKey.includes('placeholder');

let supabaseClientInstance: SupabaseClient | null = null;

try {
  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
  console.log('[Wagon AI Supabase] Client initialized successfully.', {
    configured: isSupabaseConfigured,
    url: supabaseUrl
  });
} catch (error) {
  console.error('[Wagon AI Supabase] Failed to initialize client:', error);
}

export const supabase = supabaseClientInstance as SupabaseClient;

export async function getCurrentAccessToken(): Promise<string> {
  if (isSupabaseConfigured) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }

  return localStorage.getItem('vertice_erp_token') || '';
}

export async function fetchCurrentUserProfile(accessToken?: string): Promise<any> {
  const token = accessToken || await getCurrentAccessToken();
  if (!token) throw new Error('Sessão não encontrada.');

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    throw new Error('Sessão inválida ou expirada.');
  }

  // O banco em produção ainda usa o perfil legado. Consulte apenas as colunas
  // garantidas para não invalidar o login quando campos opcionais não existem.
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('auth_id, nome, email, perfil')
    .eq('auth_id', authData.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    throw new Error('Usuário autenticado sem perfil de colaborador. Solicite acesso ao administrador.');
  }
  if (profile.perfil !== 'ADMIN' && profile.perfil !== 'VENDEDOR') {
    throw new Error('Perfil de acesso inválido.');
  }

  const isAdmin = profile.perfil === 'ADMIN';
  return {
    id: profile.auth_id,
    name: profile.nome,
    email: profile.email || authData.user.email || '',
    role: profile.perfil,
    telefone: '',
    permissions: isAdmin
      ? ['Acesso total', 'Financeiro', 'Estoque', 'Pedidos', 'Clientes', 'Vendedores', 'AI Center', 'Configurações']
      : ['Dashboard Vendedor', 'Clientes', 'Nova Venda', 'Histórico de Vendas', 'Comissão']
  };
}

export function getSupabaseErrorMsg(error: any): string {
  if (!error) return 'Erro desconhecido.';
  
  const msg = (error.message || '').toLowerCase();
  
  if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'E-mail cadastrado, mas a confirmação de e-mail está ativada no seu Supabase. Desative a opção "Confirmar e-mail" (Email confirmation) nas configurações de autenticação (Providers/Email) no painel do Supabase para conseguir logar.';
  }
  if (msg.includes('already registered') || msg.includes('already_registered') || msg.includes('user already exists')) {
    return 'Este usuário já está cadastrado no seu Supabase Auth, mas a senha informada está incorreta.';
  }
  if (error.code === 'invalid_credentials' || msg.includes('invalid credentials') || msg.includes('invalid login credentials')) {
    return 'Credenciais incorretas ou inválidas. Por favor, revise o e-mail e senha.';
  }
  if (error.status === 400) {
    return error.message || 'Erro de validação (400) no Supabase.';
  }
  
  return error.message || JSON.stringify(error);
}
