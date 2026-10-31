import { useMemo } from "react";
import { Users, UserCheck, UserPlus, HeartHandshake, ArrowUpRight, Award, ShieldCheck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney } from "../services/api";

export function CustomersView({ transactions = [], analytics }) {
  const { t } = useLanguage();

  // Aggregate customers from transactions
  const customerList = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      const cid = tx.customer_id || "Anonymous";
      if (!map[cid]) {
        map[cid] = {
          id: cid,
          totalSpent: 0,
          txnCount: 0,
          successfulTxns: 0,
          lastDate: tx.date,
          methods: new Set(),
        };
      }
      map[cid].txnCount += 1;
      if (tx.status === "success") {
        map[cid].successfulTxns += 1;
        map[cid].totalSpent += tx.amount;
      }
      if (tx.method) map[cid].methods.add(tx.method);
      if (new Date(tx.date) > new Date(map[cid].lastDate)) {
        map[cid].lastDate = tx.date;
      }
    });

    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [transactions]);

  const customerStats = analytics?.customerAnalytics || {
    newCustomers: 10,
    returningCustomers: 1,
    repeatPercentage: 9,
  };

  return (
    <div className="customers-page">
      {/* Header Banner */}
      <div className="card customer-banner">
        <div>
          <h2>Customer Growth & Retention</h2>
          <p className="banner-sub">
            Understand your patrons, repeat payment frequency, and lifetime store value.
          </p>
        </div>
        <div className="repeat-stat-pill">
          <HeartHandshake size={18} />
          <span>Repeat Rate: <strong>{customerStats.repeatPercentage}%</strong></span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="customer-summary-cards">
        <div className="card cust-card">
          <div className="cust-card-icon bg-blue-subtle">
            <Users size={20} className="text-primary" />
          </div>
          <div>
            <span className="card-sub-label">Total Unique Patrons</span>
            <h3 className="card-val">{customerList.length}</h3>
          </div>
        </div>

        <div className="card cust-card">
          <div className="cust-card-icon bg-green-subtle">
            <UserCheck size={20} className="text-success" />
          </div>
          <div>
            <span className="card-sub-label">Returning Patrons</span>
            <h3 className="card-val">{customerStats.returningCustomers}</h3>
          </div>
        </div>

        <div className="card cust-card">
          <div className="cust-card-icon bg-purple-subtle">
            <UserPlus size={20} className="text-purple" />
          </div>
          <div>
            <span className="card-sub-label">New Patrons (Period)</span>
            <h3 className="card-val">{customerStats.newCustomers}</h3>
          </div>
        </div>
      </div>

      {/* Top Patrons Table */}
      <div className="card table-container">
        <div className="panel-header">
          <div>
            <h3>Top Paying Patrons</h3>
            <span className="panel-sub">Ranked by total verified payment volume</span>
          </div>
          <span className="badge">{customerList.length} Patrons</span>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Total Spent</th>
                <th>Successful Payments</th>
                <th>Payment Methods</th>
                <th>Last Active</th>
                <th>Loyalty Status</th>
              </tr>
            </thead>
            <tbody>
              {customerList.map((cust, idx) => {
                const isRepeat = cust.successfulTxns > 1;
                return (
                  <tr key={cust.id}>
                    <td>
                      <div className="cust-cell">
                        <span className="cust-avatar-circle">
                          {cust.id.replace("C-", "#")}
                        </span>
                        <strong>{cust.id}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="amount-cell">{formatMoney(cust.totalSpent)}</span>
                    </td>
                    <td>
                      <span className="badge-tx-count">{cust.successfulTxns} visits</span>
                    </td>
                    <td>
                      <div className="methods-mini-list">
                        {[...cust.methods].map((m) => (
                          <span key={m} className={`mini-method-tag tag-${m.toLowerCase()}`}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="text-muted">
                        {new Date(cust.lastDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </td>
                    <td>
                      {isRepeat ? (
                        <span className="loyalty-pill gold">
                          <Award size={12} /> Repeat Patron (VIP)
                        </span>
                      ) : (
                        <span className="loyalty-pill standard">New Patron</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
