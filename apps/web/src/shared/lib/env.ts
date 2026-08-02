const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'إعدادات Supabase غير مكتملة. انسخ .env.example إلى .env.local وأضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY.',
  );
}

export const env = {
  supabaseUrl: url as string,
  supabaseAnonKey: anonKey as string,
};
