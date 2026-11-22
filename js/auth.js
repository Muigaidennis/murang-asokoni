/* Shared Supabase client and small UI helpers for Murang'a Sokoni. */
(() => {
  const SUPABASE_URL = 'https://zesuaxyftsmsnhkzfkkp.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplc3VheHlmdHNtc25oa3pma2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTUyMDgsImV4cCI6MjA5Mjk3MTIwOH0.9zqxjQy5y68fbwkY0V7UOyWIs07VJf6huO5ov7rygH4';

  if (!window.supabase?.createClient) {
    window.Sokoni = { ready: false, error: 'The marketplace service could not load. Check your internet connection and reload.' };
    return;
  }

  // Keep the SDK namespace (`window.supabase`) separate from this client.
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const categoryNames = {
    food: 'Food & farming', clothes: 'Clothes & fashion', building: 'Building materials',
    electronics: 'Electronics', services: 'Services'
  };

  function showMessage(element, message, kind = 'info') {
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind;
    element.hidden = !message;
  }

  function money(value) {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? `KSh ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount)}`
      : 'Price on request';
  }

  window.Sokoni = {
    ready: true,
    client,
    categoryNames,
    showMessage,
    money,
    locationName(value) {
      return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    },
    async requireSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        window.location.replace('register-seller.html?mode=login');
        return null;
      }
      return data.session;
    }
  };
})();
