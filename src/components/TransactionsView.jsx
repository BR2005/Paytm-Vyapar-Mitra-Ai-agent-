import { useState, useMemo } from "react";
import {
  Search,
  Download,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  User,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "./Toast";
import { formatMoney } from "../services/api";

export function TransactionsView({ transactions = [], loading = false }) {
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [sortKey, setSortKey] = useState("date_desc");
  const [selectedTx, setSelectedTx] = useState(null);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((item) => {
        // Search query
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          item.id.toLowerCase().includes(q) ||
          (item.customer_id && item.customer_id.toLowerCase().includes(q)) ||
          item.status.toLowerCase().includes(q) ||
          (item.method && item.method.toLowerCase().includes(q));

        // Status filter
        const matchesStatus =
          statusFilter === "all" || item.status === statusFilter;

        // Method filter
        const matchesMethod =
          methodFilter === "all" ||
          (item.method && item.method.toUpperCase() === methodFilter.toUpperCase());

        return matchesSearch && matchesStatus && matchesMethod;
      })
      .sort((a, b) => {
        if (sortKey === "date_desc") return b.date.localeCompare(a.date);
        if (sortKey === "date_asc") return a.date.localeCompare(b.date);
        if (sortKey === "amount_desc") return b.amount - a.amount;
        if (sortKey === "amount_asc") return a.amount - b.amount;
        return 0;
      });
  }, [transactions, search, statusFilter, methodFilter, sortKey]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      addToast("No transactions to export", "error");
      return;
    }

    const headers = ["Transaction ID", "Date", "Customer ID", "Amount (INR)", "Status", "Method", "Merchant ID"];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.date,
      tx.customer_id || "N/A",
      tx.amount,
      tx.status,
      tx.method || "UPI",
      tx.merchant_id || "M001",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vyaparmitra_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast("Transactions CSV downloaded successfully!", "success");
  };

  return (
    <div className="transactions-page">
      {/* Page Header */}
      <div className="table-header-card card">
        <div className="header-left">
          <h2>{t("txns_title")}</h2>
          <span className="subtext">
            {filteredTransactions.length} of {transactions.length} records found
          </span>
        </div>

        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={15} /> {t("export_csv")}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="table-controls card">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-dropdowns">
          {/* Status filter */}
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t("filter_all")}</option>
            <option value="success">{t("filter_success")}</option>
            <option value="pending">{t("filter_pending")}</option>
            <option value="failed">{t("filter_failed")}</option>
          </select>

          {/* Method filter */}
          <select
            className="filter-select"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">{t("filter_all_methods")}</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="WALLET">Wallet</option>
          </select>

          {/* Sort selector */}
          <select
            className="filter-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="date_desc">{t("sort_newest")}</option>
            <option value="date_asc">{t("sort_oldest")}</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="table-container card">
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>{t("col_id")}</th>
                <th>{t("col_date")}</th>
                <th>{t("col_customer")}</th>
                <th>{t("col_amount")}</th>
                <th>{t("col_method")}</th>
                <th>{t("col_status")}</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const dateObj = new Date(tx.date);
                const formattedDate = dateObj.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr
                    key={tx.id}
                    className="tx-row"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td>
                      <span className="tx-id-badge">{tx.id}</span>
                    </td>
                    <td>
                      <div className="date-time-cell">
                        <span className="date-text">{formattedDate}</span>
                        <span className="time-text">{formattedTime}</span>
                      </div>
                    </td>
                    <td>
                      <span className="customer-tag">
                        <User size={12} /> {tx.customer_id || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="amount-cell">{formatMoney(tx.amount)}</span>
                    </td>
                    <td>
                      <span className={`method-pill method-${(tx.method || "UPI").toLowerCase()}`}>
                        {tx.method || "UPI"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${tx.status}`}>
                        {tx.status === "success" && <CheckCircle2 size={12} />}
                        {tx.status === "pending" && <Clock size={12} />}
                        {tx.status === "failed" && <AlertCircle size={12} />}
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-view-details"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!filteredTransactions.length && !loading && (
          <div className="empty-state-card">
            <AlertCircle size={36} className="empty-icon" />
            <h4>{t("no_txns_found")}</h4>
            <p>Try clearing your search query or changing your status filters.</p>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setMethodFilter("all");
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="modal-backdrop" onClick={() => setSelectedTx(null)}>
          <div
            className="modal-content card animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-subtitle">Paytm Payment Receipt</span>
                <h3>{selectedTx.id}</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedTx(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-receipt-body">
              <div className="receipt-amount-display">
                <span className="receipt-amount-label">Settlement Amount</span>
                <span className="receipt-amount-value">
                  {formatMoney(selectedTx.amount)}
                </span>
                <span className={`status-badge status-${selectedTx.status}`}>
                  {selectedTx.status.toUpperCase()}
                </span>
              </div>

              <div className="receipt-details-grid">
                <div className="receipt-item">
                  <span className="receipt-label">
                    <Calendar size={13} /> Timestamp
                  </span>
                  <span className="receipt-val">
                    {new Date(selectedTx.date).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="receipt-item">
                  <span className="receipt-label">
                    <CreditCard size={13} /> Payment Method
                  </span>
                  <span className="receipt-val">{selectedTx.method || "UPI"}</span>
                </div>

                <div className="receipt-item">
                  <span className="receipt-label">
                    <User size={13} /> Customer Reference
                  </span>
                  <span className="receipt-val">{selectedTx.customer_id}</span>
                </div>

                <div className="receipt-item">
                  <span className="receipt-label">Merchant Terminal</span>
                  <span className="receipt-val">{selectedTx.merchant_id || "M001"}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `Transaction ${selectedTx.id}: ${formatMoney(selectedTx.amount)} via ${selectedTx.method} (${selectedTx.status})`
                  );
                  addToast("Transaction details copied to clipboard!", "info");
                  setSelectedTx(null);
                }}
              >
                Copy Details
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setSelectedTx(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
