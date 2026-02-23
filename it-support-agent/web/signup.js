// ====================================================================
// CONFIG — hardcoded, no manual setup required
// ====================================================================

let CONFIG = {
  userPoolId: 'us-east-2_wrFSXya7F',
  clientId: '5omm89afr837vgbgoa81notj9k',
  region: 'us-east-2',
  hostedDomain: ''
};

// Optional: allow localStorage overrides for advanced users (only non-empty values)
try {
  const saved = localStorage.getItem('cognitoConfig');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.userPoolId) CONFIG.userPoolId = parsed.userPoolId;
    if (parsed.clientId) CONFIG.clientId = parsed.clientId;
    if (parsed.region) CONFIG.region = parsed.region;
  }
} catch (e) {
  localStorage.removeItem('cognitoConfig');
}

let currentUsername = null;
let currentEmail = null;

// Initialize immediately — no manual config needed
const userPool = new AmazonCognitoIdentity.CognitoUserPool({
  UserPoolId: CONFIG.userPoolId,
  ClientId: CONFIG.clientId
});

function getUserPool() {
  return new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: CONFIG.userPoolId,
    ClientId: CONFIG.clientId
  });
}

// ====================================================================
// CONFIG MODAL  — same as app.js
// ====================================================================

// Hide config banner if Cognito config is present
document.addEventListener('DOMContentLoaded', function () {
  try {
    const config = localStorage.getItem('cognitoConfig');
    if (config) {
      document.getElementById('configBanner').style.display = 'none';
    }
  } catch (e) { }
});
function openConfig() {
  document.getElementById('cfgPoolId').value = CONFIG.userPoolId;
  document.getElementById('cfgClientId').value = CONFIG.clientId;
  document.getElementById('cfgRegion').value = CONFIG.region;
  document.getElementById('configModal').classList.add('show');
}

function closeConfig() {
  document.getElementById('configModal').classList.remove('show');
}

function saveConfig() {
  CONFIG.userPoolId = document.getElementById('cfgPoolId').value.trim();
  CONFIG.clientId = document.getElementById('cfgClientId').value.trim();
  CONFIG.region = document.getElementById('cfgRegion').value.trim() || 'us-east-1';
  CONFIG.hostedDomain = '';

  if (!CONFIG.userPoolId || !CONFIG.clientId) {
    showAlert('error', 'Please fill in all configuration fields.');
    return;
  }

  localStorage.setItem('cognitoConfig', JSON.stringify(CONFIG));
  // userPool is now a const, so we don't reassign it here.
  // The getUserPool() function will pick up the updated CONFIG.
  updateConfigUI();
  closeConfig();
  showAlert('success', 'Configuration saved.');
}

// Banner is hidden by default since credentials are baked in.
// Only shows if someone manually clears the config.
function updateConfigUI() {
  const banner = document.getElementById('configBanner');
  if (banner) banner.style.display = 'none';
}

// ====================================================================
// ALERT  — signature matches app.js: showAlert(type, msg)
// ====================================================================

function showAlert(type, msg) {
  const el = document.getElementById('alert');
  const txt = document.getElementById('alertMsg');
  const svg = el.querySelector('svg');

  el.className = 'alert show alert-' + type;
  txt.textContent = msg;
  svg.innerHTML = type === 'error'
    ? '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>'
    : '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>';

  // auto-hide after 5 s
  setTimeout(() => { el.className = 'alert'; }, 5000);
}

function clearAlert() {
  document.getElementById('alert').className = 'alert';
}

// ====================================================================
// PASSWORD VALIDATION
// ====================================================================

function validatePassword() {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  const req = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    match: password === confirmPassword && password.length > 0
  };

  document.getElementById('req-length').className = req.length ? 'valid' : '';
  document.getElementById('req-uppercase').className = req.uppercase ? 'valid' : '';
  document.getElementById('req-lowercase').className = req.lowercase ? 'valid' : '';
  document.getElementById('req-number').className = req.number ? 'valid' : '';
  document.getElementById('req-special').className = req.special ? 'valid' : '';
  document.getElementById('req-match').className = req.match ? 'valid' : '';

  return Object.values(req).every(Boolean);
}

// ====================================================================
// PASSWORD VISIBILITY TOGGLES  — same compact style as app.js
// ====================================================================

function togglePassword() {
  const inp = document.getElementById('password');
  const icon = document.getElementById('eyeIcon');
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  icon.innerHTML = show
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

function toggleConfirmPassword() {
  const inp = document.getElementById('confirmPassword');
  const icon = document.getElementById('confirmEyeIcon');
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  icon.innerHTML = show
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

function toggleShowPassword() {
  const show = document.getElementById('showPassword').checked;
  document.getElementById('password').type = show ? 'text' : 'password';
  document.getElementById('confirmPassword').type = show ? 'text' : 'password';
}

// ====================================================================
// SIGN-UP HANDLER
// ====================================================================

function handleSignUp(event) {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const fullName = document.getElementById('fullName').value.trim();
  const password = document.getElementById('password').value;

  if (!validatePassword()) {
    showAlert('error', 'Please meet all password requirements.');
    return;
  }

  const pool = getUserPool();
  const btn = document.getElementById('signUpBtn');
  btn.classList.add('loading');
  btn.disabled = true;

  const attributeList = [
    new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email }),
    new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'name', Value: fullName })
  ];

  pool.signUp(username, password, attributeList, null, (err, result) => {
    btn.classList.remove('loading');
    btn.disabled = false;

    if (err) {
      showAlert('error', err.message || 'Sign up failed.');
      return;
    }

    currentUsername = username;
    currentEmail = email;

    showAlert('success', 'Account created! Please verify your email.');
    document.getElementById('verifyEmail').textContent = email;
    document.getElementById('verificationModal').classList.add('show');
  });
}

// ====================================================================
// EMAIL VERIFICATION
// ====================================================================

function handleVerification() {
  if (!currentUsername) { showAlert('error', 'No pending verification.'); return; }

  const code = document.getElementById('verificationCode').value.trim();
  if (!code) { showAlert('error', 'Please enter the verification code.'); return; }

  const btn = document.getElementById('verifyBtn');
  btn.disabled = true;

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: currentUsername,
    Pool: getUserPool()
  });

  cognitoUser.confirmRegistration(code, true, (err) => {
    btn.disabled = false;
    if (err) {
      showAlert('error', err.message || 'Verification failed.');
      return;
    }
    showAlert('success', 'Email verified! Redirecting to sign in…');
    setTimeout(() => { window.location.href = 'signin.html'; }, 1000);
  });
}

function resendVerificationCode() {
  if (!currentUsername) { showAlert('error', 'No pending verification.'); return; }

  new AmazonCognitoIdentity.CognitoUser({
    Username: currentUsername,
    Pool: getUserPool()
  }).resendConfirmationCode((err) => {
    if (err) { showAlert('error', err.message || 'Failed to resend code.'); return; }
    showAlert('success', 'Verification code resent to ' + currentEmail);
  });
}

// ====================================================================
// BOOTSTRAP
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  updateConfigUI(); // hides banner since creds are baked in

  document.getElementById('password').addEventListener('input', validatePassword);
  document.getElementById('confirmPassword').addEventListener('input', validatePassword);

  // Close modals on overlay click
  document.getElementById('configModal').addEventListener('click', function (e) {
    if (e.target === this) closeConfig();
  });
  document.getElementById('verificationModal').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('show');
  });
});