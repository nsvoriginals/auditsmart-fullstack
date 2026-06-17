import axios from "axios";

// Same-origin Next API routes under /api/workspace. Auth rides the NextAuth
// session cookie (withCredentials), so no bearer token is needed.
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/workspace",
    withCredentials: true,
});

// Kept for source-compatibility with the ported Clerk code. Token auth is no
// longer used (cookie-based), so this is a no-op.
export const setAuthToken = (_token: string | null) => {
    // intentionally empty — NextAuth session cookie handles auth
};

export default api;
