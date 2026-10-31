import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { useCountUp } from "../hooks/useCountUp";

export function KPICard({
  label,
  value,
  isCurrency = false,
  note,
  changePercent = null,
  trendPositive = true,
  icon: Icon,
  variant = "default",
  tooltipText = "",
  loading = false,
}) {
  const animatedValue = useCountUp(value, 900, "", isCurrency);
  const [showTooltip, setShowTooltip] = useState(false);

  if (loading) {
    return (
      <div className={`kpi-card skeleton-card kpi-${variant}`}>
        <div className="skeleton skeleton-icon" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-value" />
        <div className="skeleton skeleton-note" />
      </div>
    );
  }

  return (
    <article className={`kpi-card kpi-${variant}`}>
      <div className="kpi-header">
        <div className="kpi-icon-wrap">
          {Icon && <Icon className="kpi-icon" size={20} />}
        </div>
        {changePercent !== null && !isNaN(changePercent) && (
          <span
            className={`kpi-trend-pill ${
              changePercent >= 0 ? "trend-up" : "trend-down"
            }`}
          >
            {changePercent >= 0 ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {Math.abs(changePercent)}%
          </span>
        )}
      </div>

      <div className="kpi-body">
        <div className="kpi-label-row">
          <span className="kpi-label">{label}</span>
          {tooltipText && (
            <div
              className="kpi-tooltip-trigger"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip((p) => !p)}
            >
              <Info size={13} className="info-icon" />
              {showTooltip && <div className="kpi-tooltip">{tooltipText}</div>}
            </div>
          )}
        </div>
        <div className="kpi-value">{animatedValue}</div>
        {note && <div className="kpi-note">{note}</div>}
      </div>
    </article>
  );
}
