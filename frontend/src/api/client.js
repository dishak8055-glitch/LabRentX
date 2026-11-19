/**
 * API client with automatic JWT token attachment and error extraction
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const makeUrl = (endpoint) => {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const getApiAssetUrl = (path) => {
  if (!path) return '';
  const apiOrigin = /^https?:\/\//i.test(BASE_URL)
    ? new URL(BASE_URL).origin
    : window.location.origin;
  return new URL(path, `${apiOrigin}/`).toString();
};

export const downloadApiFile = async (endpoint, filename) => {
  const blob = await apiRequest(endpoint, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

export const getTokens = () => {
  return {
    access: localStorage.getItem('lrx_access_token'),
    refresh: localStorage.getItem('lrx_refresh_token'),
  };
};

export const setTokens = (access, refresh) => {
  if (access) localStorage.setItem('lrx_access_token', access);
  if (refresh) localStorage.setItem('lrx_refresh_token', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('lrx_access_token');
  localStorage.removeItem('lrx_refresh_token');
  localStorage.removeItem('lrx_user');
};

export async function apiRequest(endpoint, options = {}) {
  const { access } = getTokens();
  const { responseType, ...requestOptions } = options;
  const headers = {
    ...requestOptions.headers,
  };

  // Only set Content-Type if body is not FormData
  if (!(requestOptions.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (access) {
    headers['Authorization'] = `Bearer ${access}`;
  }

  const url = makeUrl(endpoint);
  let response = await fetch(url, {
    ...requestOptions,
    headers,
  });

  // Handle Token Expiry (401)
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const { refresh } = getTokens();
    if (refresh) {
      try {
        const refreshResp = await fetch(`${BASE_URL}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (refreshResp.ok) {
          const data = await refreshResp.json();
          setTokens(data.access, data.refresh);
          headers['Authorization'] = `Bearer ${data.access}`;
          // Retry original request
          response = await fetch(url, { ...requestOptions, headers });
        } else {
          clearTokens();
          window.location.href = '/login';
        }
      } catch {
        clearTokens();
        window.location.href = '/login';
      }
    } else {
      clearTokens();
    }
  }

  // Parse response
  const contentType = response.headers.get('content-type') || '';
  let responseData;
  if (responseType === 'blob') {
    responseData = await response.blob();
  } else if (contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred';
    if (typeof responseData === 'object' && responseData !== null) {
      // Pick first error message
      const firstKey = Object.keys(responseData)[0];
      const val = responseData[firstKey];
      if (Array.isArray(val)) {
        errorMsg = `${firstKey}: ${val[0]}`;
      } else if (typeof val === 'string') {
        errorMsg = val;
      } else if (responseData.detail) {
        errorMsg = responseData.detail;
      } else if (responseData.error) {
        errorMsg = responseData.error;
      }
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  return responseData;
}
