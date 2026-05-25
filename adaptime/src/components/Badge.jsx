import { statusBadge, typeBadge } from '../utils/helpers';

export function StatusBadge({ status }) {
  const { cls, label } = statusBadge(status);
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function TypeBadge({ type }) {
  const { cls, label } = typeBadge(type);
  return <span className={`badge ${cls}`}>{label}</span>;
}
