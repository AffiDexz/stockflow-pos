import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Surface a clean message from the backend's { error } shape.
export function apiError(err) {
  return err?.response?.data?.error || err?.message || 'Something went wrong.';
}

export default api;
