# VyaparMitra AI

**Your Business. Your Language. Your AI.**

VyaparMitra AI is an AI-powered merchant business intelligence platform that helps merchants understand payments, analyze business performance, and grow their businesses through visual analytics and multilingual voice assistance.

## Product features

- **VyaparMitra Insights** - Merchant analytics dashboard.
- **VyaparMitra Voice** - Multilingual AI voice assistant powered by the existing Sarvam integration.
- **VyaparMitra EOD** - AI-generated end-of-day reports.
- **VyaparMitra Growth** - Evidence-based business recommendations.
- **VyaparMitra Payments** - Payment analytics and transaction history.

## Running locally

```powershell
npm run dev
```

The Express API is in `merchant-backend` and preserves the existing Business Stats and merchant routes:

```powershell
node merchant-backend/server.js
```

The current sample transactions are labeled as demo data. All dashboard and voice figures continue to derive from the same backend transaction records.
