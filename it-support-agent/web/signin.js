
let CONFIG = {
  userPoolId: 'us-east-2_wrFSXya7F',
  clientId: '5omm89afr837vgbgoa81notj9k',
  region: 'us-east-2',
  hostedDomain: ''
};

const saved = localStorage.getItem('cognitoConfig');
if (saved) { CONFIG = { ...CONFIG, ...JSON.parse(saved) }; updateConfigUI(); }

function getUserPool() {
  return new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: CONFIG.userPoolId,
    ClientId: CONFIG.clientId
  });
}

// ═══════════════════════════════════════════════════════════════
// SIGN IN
// ═══════════════════════════════════════════════════════════════

function handleSignIn() {
  if (!CONFIG.userPoolId || !CONFIG.clientId) {
    showAlert('error', 'Configure your Cognito User Pool ID and Client ID first.');
    openConfig();
    return;
  }
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) {
    showAlert('error', 'Please enter your username and password.');
    return;
  }
  setLoading(true);
  clearAlert();
  const pool = getUserPool();
  const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: username,
    Password: password
  });
  const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: username,
    Pool: pool
  });
  cognitoUser.authenticateUser(authDetails, {
    onSuccess(session) {
      setLoading(false);
      callBackend(session.getAccessToken().getJwtToken());
    },
    onFailure(err) {
      setLoading(false);
      showAlert('error', err.message || 'Authentication failed.');
    },
    newPasswordRequired() {
      setLoading(false);
      showAlert('error', 'New password required. Please use the Hosted UI.');
    },
    mfaRequired() {
      setLoading(false);
      showAlert('error', 'MFA required. Please use the Hosted UI.');
    },
    totpRequired() {
      setLoading(false);
      showAlert('error', 'TOTP required. Please use the Hosted UI.');
    }
  });
}

async function callBackend(token) {
  try {
    const response = await fetch("https://vwxy0t8xli.execute-api.us-east-2.amazonaws.com/dev/invoke", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: "ping" })
    });
    if (!response.ok) {
      showAlert("error", "Status: " + response.status);
      return;
    }
    window.location.href = "https://d1mrsr4pwh1473.cloudfront.net";
  } catch (err) {
    showAlert("error", "Backend verification failed: " + err.message);
  }
}

function handleSignOut() {
  const user = getUserPool().getCurrentUser();
  if (user) user.signOut();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  document.getElementById('tokenBox').classList.remove('show');
  document.getElementById('signInForm').style.display = '';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  showAlert('success', 'Signed out successfully.');
}

// ═══════════════════════════════════════════════════════════════
// FORGOT PASSWORD WITH TWO-STEP VERIFICATION
// ═══════════════════════════════════════════════════════════════

function handleForgotPassword() {
  const username = document.getElementById('username').value.trim();
  if (!username) {
    showAlert('error', 'Enter your username or email first.');
    return;
  }
  setLoading(true);
  clearAlert();
  const pool = getUserPool();
  const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: username,
    Pool: pool
  });

  cognitoUser.forgotPassword({
    onSuccess() {
      setLoading(false);
      resetUsername = username;
      showAlert('success', `Reset code sent to the email linked to "${username}".`);
      setTimeout(() => {
        clearAlert();
        openResetPasswordModal();
      }, 1500);
    },
    onFailure(err) {
      setLoading(false);

      // Log the full error to console for debugging
      console.log('Forgot Password Error:', err);
      console.log('Error Code:', err.code);
      console.log('Error Name:', err.name);
      console.log('Error Message:', err.message);

      // Check for user not found
      if (err.code === 'UserNotFoundException' ||
        err.name === 'UserNotFoundException' ||
        err.message.toLowerCase().includes('user does not exist') ||
        err.message.toLowerCase().includes('username/client id combination not found')) {
        showAlert('error', `No account found for "${username}". Please check your username and try again.`);
        return;
      }

      if (err.code === 'InvalidParameterException') {
        showAlert('error', 'Cannot reset password: No verified email or phone number associated with this account. Please contact support.');
      } else if (err.code === 'LimitExceededException') {
        showAlert('error', 'Too many attempts. Please wait a few minutes and try again.');
      } else if (err.code === 'NotAuthorizedException') {
        showAlert('error', 'Password reset is not allowed for this user. Please contact support.');
      } else if (err.code === 'CodeDeliveryFailureException') {
        showAlert('error', 'Failed to send verification code. Please check your email address and try again.');
      } else {
        showAlert('error', err.message || 'Failed to send reset code. Please try again.');
      }
    },
    inputVerificationCode(data) {
      setLoading(false);
      resetUsername = username;
      showAlert('success', `Reset code sent to ${data.CodeDeliveryDetails.Destination}.`);
      setTimeout(() => {
        clearAlert();
        openResetPasswordModal();
      }, 1500);
    }
  });
}
function openResetPasswordModal() {
  document.getElementById('resetPasswordModal').classList.add('show');
  document.getElementById('verificationCode').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  resetPasswordRequirements();
}

function closeResetPasswordModal() {
  document.getElementById('resetPasswordModal').classList.remove('show');
  resetUsername = '';
  resetPasswordRequirements();
}

// ═══════════════════════════════════════════════════════════════
// PASSWORD VALIDATION
// ═══════════════════════════════════════════════════════════════

function validatePassword(password) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
}

function updatePasswordRequirements() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const validation = validatePassword(newPassword);

  // Update each requirement indicator
  updateReqStatus('req-length', validation.length);
  updateReqStatus('req-uppercase', validation.uppercase);
  updateReqStatus('req-lowercase', validation.lowercase);
  updateReqStatus('req-number', validation.number);
  updateReqStatus('req-special', validation.special);

  // Check if passwords match (only if both fields have content)
  if (newPassword && confirmPassword) {
    updateReqStatus('req-match', newPassword === confirmPassword);
  } else {
    // Reset match indicator if fields are empty
    const matchElem = document.getElementById('req-match');
    if (matchElem) {
      matchElem.classList.remove('valid', 'invalid');
    }
  }
}

function updateReqStatus(elemId, isValid) {
  const elem = document.getElementById(elemId);
  if (!elem) return;

  elem.classList.remove('valid', 'invalid');
  if (isValid) {
    elem.classList.add('valid');
  } else if (document.getElementById('newPassword').value.length > 0) {
    elem.classList.add('invalid');
  }
}

function resetPasswordRequirements() {
  const reqIds = ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special', 'req-match'];
  reqIds.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.classList.remove('valid', 'invalid');
    }
  });
}

function isPasswordValid() {
  const password = document.getElementById('newPassword').value;
  const validation = validatePassword(password);
  return validation.length &&
    validation.uppercase &&
    validation.lowercase &&
    validation.number &&
    validation.special;
}

// ═══════════════════════════════════════════════════════════════
// RESET PASSWORD HANDLER
// ═══════════════════════════════════════════════════════════════

function handleResetPassword() {
  const code = document.getElementById('verificationCode').value.trim();
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Validation
  if (!code) {
    showAlert('error', 'Please enter the verification code.');
    return;
  }

  if (!newPassword) {
    showAlert('error', 'Please enter a new password.');
    return;
  }

  if (!isPasswordValid()) {
    showAlert('error', 'Password does not meet all requirements.');
    return;
  }

  if (newPassword !== confirmPassword) {
    showAlert('error', 'Passwords do not match.');
    return;
  }

  setLoading(true, 'resetPasswordBtn');

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: resetUsername,
    Pool: getUserPool()
  });

  cognitoUser.confirmPassword(code, newPassword, {
    onSuccess() {
      setLoading(false, 'resetPasswordBtn');
      closeResetPasswordModal();
      showAlert('success', 'Password reset successfully! Please sign in with your new password.');
      // Pre-fill username for convenience
      document.getElementById('username').value = resetUsername;
      resetUsername = '';
    },
    onFailure(err) {
      setLoading(false, 'resetPasswordBtn');

      // Provide user-friendly error messages
      if (err.code === 'CodeMismatchException') {
        showAlert('error', 'Invalid verification code. Please check the code and try again.');
      } else if (err.code === 'ExpiredCodeException') {
        showAlert('error', 'Verification code has expired. Please request a new code.');
      } else if (err.code === 'InvalidPasswordException') {
        showAlert('error', 'Password does not meet requirements. Please try a different password.');
      } else if (err.code === 'LimitExceededException') {
        showAlert('error', 'Too many attempts. Please wait and try again later.');
      } else {
        showAlert('error', err.message || 'Failed to reset password.');
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// PASSWORD VISIBILITY TOGGLES
// ═══════════════════════════════════════════════════════════════

function togglePassword() {
  const inp = document.getElementById('password');
  const icon = document.getElementById('eyeIcon');
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  icon.innerHTML = show
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

function toggleNewPassword() {
  const inp = document.getElementById('newPassword');
  const icon = document.getElementById('newPasswordEyeIcon');
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  icon.innerHTML = show
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

function toggleConfirmPassword() {
  const inp = document.getElementById('confirmPassword');
  const icon = document.getElementById('confirmPasswordEyeIcon');
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  icon.innerHTML = show
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  // Sign-in form Enter key
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSignIn();
    });
  }

  // Reset password modal Enter key navigation
  const verificationCode = document.getElementById('verificationCode');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');

  if (verificationCode) {
    verificationCode.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        newPassword.focus();
      }
    });
  }

  if (newPassword) {
    newPassword.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmPassword.focus();
      }
    });
    // Update requirements as user types
    newPassword.addEventListener('input', updatePasswordRequirements);
  }

  if (confirmPassword) {
    confirmPassword.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleResetPassword();
      }
    });
    // Update match requirement as user types
    confirmPassword.addEventListener('input', updatePasswordRequirements);
  }

  // Close modal on overlay click
  const configModal = document.getElementById('configModal');
  const resetModal = document.getElementById('resetPasswordModal');

  if (configModal) {
    configModal.addEventListener('click', function (e) {
      if (e.target === this) closeConfig();
    });
  }

  if (resetModal) {
    resetModal.addEventListener('click', function (e) {
      if (e.target === this) closeResetPasswordModal();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function checkHostedUICallback() {
  const code = new URLSearchParams(window.location.search).get('code');
  if (!code || !CONFIG.clientId || !CONFIG.userPoolId) return;
  showAlert('success', 'Authorization code received. Exchange server-side for tokens.');
  window.history.replaceState({}, {}, window.location.pathname);
}

function setLoading(on, btnId = 'signInBtn') {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.disabled = on;

  if (btnId === 'signInBtn') {
    btn.classList.toggle('loading', on);
  } else {
    // For other buttons, just show disabled state
    btn.style.opacity = on ? '0.5' : '1';
    btn.style.cursor = on ? 'not-allowed' : 'pointer';
  }
}

function showAlert(type, msg) {
  const el = document.getElementById('alert');
  const txt = document.getElementById('alertMsg');
  const svg = el.querySelector('svg');

  el.className = 'alert show alert-' + type;
  el.style.display = 'flex';          // force visible regardless of CSS
  el.style.opacity = '1';
  txt.textContent = msg;
  svg.innerHTML = type === 'error'
    ? '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>'
    : '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>';
}

function clearAlert() {
  const el = document.getElementById('alert');
  el.className = 'alert';
  el.style.display = 'none';    // hide explicitly
}

function showTokens(access, id) {
  document.getElementById('signInForm').style.display = 'none';
  document.getElementById('accessTokenVal').textContent = access;
  document.getElementById('idTokenVal').textContent = id;
  document.getElementById('tokenBox').classList.add('show');
}

// ═══════════════════════════════════════════════════════════════
// CONFIG MODAL
// ═══════════════════════════════════════════════════════════════

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

  localStorage.setItem('cognitoConfig', JSON.stringify(CONFIG));
  updateConfigUI();
  closeConfig();
  showAlert('success', 'Configuration saved.');
}

function updateConfigUI() {
  const configured = CONFIG.userPoolId && CONFIG.clientId;
  const banner = document.getElementById('configBanner');
  const badge = document.getElementById('regionBadge');

  if (banner) {
    banner.style.display = configured ? 'none' : '';
  }

  if (badge) {
    badge.textContent = 'region: ' + (CONFIG.region || '—');
  }
}

// Initialize
checkHostedUICallback();