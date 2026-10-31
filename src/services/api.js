const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/$/, "");

export async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const merchantApi = {
  getHealth: () => fetchJson("/api/health"),
  getVoiceSummary: () => fetchJson("/api/merchant/voice-summary"),
  getAnalytics: (period = "7d") => fetchJson(`/api/merchant/analytics?period=${period}`),
  getTransactions: (search = "") =>
    fetchJson(`/api/merchant/transactions${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getEodReport: () => fetchJson("/api/merchant/eod-report"),
};

export const formatMoney = (val) => {
  const num = Number(val || 0);
  return `₹${num.toLocaleString("en-IN")}`;
};
