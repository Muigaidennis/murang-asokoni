(() => {
  const form = document.getElementById('auth-form');
  if (!form || !window.Sokoni?.ready) return;
  const nameGroup = document.getElementById('name-group');
  const locationGroup = document.getElementById('location-group');
  const otpGroup = document.getElementById('otp-group');
  const nameInput = document.getElementById('seller-name');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const otpInput = document.getElementById('otp');
  const submit = document.getElementById('auth-submit');
  const message = document.getElementById('auth-message');
  const title = document.getElementById('auth-title');
  const description = document.getElementById('auth-description');
  const signupTab = document.getElementById('signup-tab');
  const loginTab = document.getElementById('login-tab');
  const url = new URL(window.location.href);
  let mode = url.searchParams.get('mode') === 'login' ? 'login' : 'signup';
  let needsOtp = false;

  function setMode(nextMode) {
    mode = nextMode;
    needsOtp = false;
    sessionStorage.removeItem('sokoni_pending_phone');
    otpGroup.hidden = true;
    otpInput.required = false;
    nameGroup.hidden = mode === 'login';
    locationGroup.hidden = mode === 'login';
    nameInput.required = mode === 'signup';
    document.getElementById('location').required = mode === 'signup';
    passwordInput.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    title.textContent = mode === 'login' ? 'Welcome back' : 'Create your seller account';
    description.textContent = mode === 'login'
      ? 'Log in to manage your Murang’a Sokoni listings.'
      : 'Set up your account and start reaching customers around Murang’a.';
    submit.textContent = mode === 'login' ? 'Log in' : 'Create seller account';
    signupTab.setAttribute('aria-selected', String(mode === 'signup'));
    loginTab.setAttribute('aria-selected', String(mode === 'login'));
    Sokoni.showMessage(message, '');
  }

  function normalizeKenyanPhone(input) {
    let digits = input.replace(/[^\d+]/g, '');
    if (digits.startsWith('+254')) digits = digits.slice(4);
    else if (digits.startsWith('254')) digits = digits.slice(3);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    if (!/^(7|1)\d{8}$/.test(digits)) return null;
    return `+254${digits}`;
  }

  signupTab.addEventListener('click', () => setMode('signup'));
  loginTab.addEventListener('click', () => setMode('login'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    Sokoni.showMessage(message, '');
    const phone = normalizeKenyanPhone(phoneInput.value.trim());
    if (!phone) {
      Sokoni.showMessage(message, 'Enter a valid Kenyan mobile number, for example 0712 345 678.', 'error');
      phoneInput.focus();
      return;
    }
    if (passwordInput.value.length < 8) {
      Sokoni.showMessage(message, 'Your password must be at least 8 characters.', 'error');
      passwordInput.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = needsOtp ? 'Verifying…' : (mode === 'login' ? 'Logging in…' : 'Creating account…');
    try {
      if (needsOtp) {
        if (!/^\d{6}$/.test(otpInput.value.trim())) throw new Error('Enter the 6-digit SMS verification code.');
        const { error } = await Sokoni.client.auth.verifyOtp({ phone, token: otpInput.value.trim(), type: 'sms' });
        if (error) throw error;
        sessionStorage.removeItem('sokoni_pending_phone');
        window.location.assign('dashboard.html');
        return;
      }

      if (mode === 'signup') {
        const name = nameInput.value.trim();
        const location = document.getElementById('location').value;
        if (!name || !location) throw new Error('Enter your name and choose your Murang’a area.');
        const { data, error } = await Sokoni.client.auth.signUp({
          phone,
          password: passwordInput.value,
          options: { data: { full_name: name, location, role: 'seller' } }
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign('dashboard.html');
          return;
        }
        needsOtp = true;
        sessionStorage.setItem('sokoni_pending_phone', phone);
        phoneInput.value = phone;
        otpGroup.hidden = false;
        otpInput.required = true;
        otpInput.focus();
        submit.textContent = 'Verify phone number';
        Sokoni.showMessage(message, 'We sent a verification code to your phone. Enter it below to finish creating your account.');
        return;
      }

      const { error } = await Sokoni.client.auth.signInWithPassword({ phone, password: passwordInput.value });
      if (error) throw error;
      window.location.assign('dashboard.html');
    } catch (error) {
      Sokoni.showMessage(message, error.message || 'We couldn’t complete that request. Please try again.', 'error');
    } finally {
      submit.disabled = false;
      if (!needsOtp) submit.textContent = mode === 'login' ? 'Log in' : 'Create seller account';
    }
  });

  setMode(mode);
  const pendingPhone = sessionStorage.getItem('sokoni_pending_phone');
  if (pendingPhone) {
    phoneInput.value = pendingPhone;
    otpGroup.hidden = false;
    otpInput.required = true;
    needsOtp = true;
    submit.textContent = 'Verify phone number';
    Sokoni.showMessage(message, 'Enter the verification code sent to your phone to finish registration.');
  }
})();
