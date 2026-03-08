/**
 * SIGEC - Cliente API
 * Comunicação com o backend via fetch
 */

// Configurar a URL da Edge Function do Supabase
const API_BASE = 'https://yhphihsfailrlwvodmwn.supabase.co/functions/v1/sigec-api';

let _token = localStorage.getItem('sigec_token');
let _user  = JSON.parse(localStorage.getItem('sigec_user') || 'null');

// ─── Helpers ──────────────────────────────────────────────
function setAuth(token, user) {
  _token = token;
  _user  = user;
  localStorage.setItem('sigec_token', token);
  localStorage.setItem('sigec_user', JSON.stringify(user));
}

function clearAuth() {
  _token = null;
  _user  = null;
  localStorage.removeItem('sigec_token');
  localStorage.removeItem('sigec_user');
}

function getUser()  { return _user; }
function getToken() { return _token; }
function isLoggedIn() { return !!_token && !!_user; }

// ─── Request Principal ────────────────────────────────────
async function apiRequest(path, opts = {}) {
  const url = API_BASE + path;
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };
  if (_token) headers['Authorization'] = 'Bearer ' + _token;

  let res;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch (err) {
    throw new Error('Sem conexão com o servidor. Verifique sua internet.');
  }

  if (res.status === 401) {
    clearAuth();
    window.location.reload();
    return null;
  }

  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    if (data.codigo === 'LICENCA_INATIVA') {
      showLicencaExpirada(data.error);
      return null;
    }
    throw new Error(data.error || 'Acesso negado');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

// ─── Atalhos ──────────────────────────────────────────────
const api = {
  get:    (path)        => apiRequest(path),
  post:   (path, body)  => apiRequest(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)  => apiRequest(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)        => apiRequest(path, { method: 'DELETE' })
};

// ─── Aviso Licença Expirada ───────────────────────────────
function showLicencaExpirada(msg) {
  const el = document.getElementById('licenca-modal');
  if (el) {
    document.getElementById('licenca-msg').textContent = msg || 'Licença expirada.';
    el.style.display = 'flex';
  }
}

// Exportar globalmente
window.api = api;
window.getUser = getUser;
window.getToken = getToken;
window.isLoggedIn = isLoggedIn;
window.setAuth = setAuth;
window.clearAuth = clearAuth;
