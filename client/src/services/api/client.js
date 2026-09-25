import { API_URL, DEMO_MODE } from '../../config/env';

let tokenGetter = () => null;
export const setTokenGetter = (fn) => {
  tokenGetter = fn;
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body, { isForm = false } = {}) {
  const token = tokenGetter();
  const headers = {};
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? 'Something went wrong', res.status, data?.details);
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  patch: (p, b) => request('PATCH', p, b ?? {}),
  put: (p, b) => request('PUT', p, b ?? {}),
  delete: (p) => request('DELETE', p),
  upload: (p, formData) => request('POST', p, formData, { isForm: true }),
};

/**
 * Fire a server write after an optimistic local update. In demo mode this is
 * a no-op; with a backend, failures surface as a gentle toast.
 */
let onRemoteError = () => {};
export const setRemoteErrorHandler = (fn) => {
  onRemoteError = fn;
};
export function remote(fn) {
  if (DEMO_MODE) return Promise.resolve(null);
  return fn().catch((err) => {
    onRemoteError(err);
    return null;
  });
}
