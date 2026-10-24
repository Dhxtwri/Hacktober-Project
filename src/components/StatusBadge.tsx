import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';
import { VerdictStatus } from '../types/scheme';

interface StatusBadgeProps {
  status: VerdictStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  label,
}) => {
  let bg = 'bg-[#ECFDF5]';
  let border = 'border-[#A7F3D0]';
  let text = 'text-[#065F46]';
  let Icon = CheckCircle2;
  let defaultLabel = 'Likely eligible (प्रारंभिक)';

  if (status === 'likely_ineligible') {
    bg = 'bg-[#FFF1F2]';
    border = 'border-[#FECDD3]';
    text = 'text-[#9F1239]';
    Icon = XCircle;
    defaultLabel = 'Likely ineligible (प्रारंभिक)';
  } else if (status === 'PENDING' || status === 'needs_more_information') {
    bg = 'bg-[#FFFBEB]';
    border = 'border-[#FDE68A]';
    text = 'text-[#92400E]';
    Icon = AlertCircle;
    defaultLabel = 'Needs more information (जानकारी आवश्यक)';
  } else if (status === 'INFO') {
    bg = 'bg-[#EFF6FF]';
    border = 'border-[#BFDBFE]';
    text = 'text-[#1E3A8A]';
    Icon = Info;
    defaultLabel = 'Informational (जानकारी)';
  } else if (status === 'VERIFIED') {
    bg = 'bg-[#ECFDF5]';
    border = 'border-[#A7F3D0]';
    text = 'text-[#047857]';
    Icon = CheckCircle2;
    defaultLabel = 'Aadhaar Verified (सत्यापित)';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded border font-sans uppercase tracking-wide leading-none ${bg} ${border} ${text} ${sizeClasses}`}
      role="status"
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{label || defaultLabel}</span>
    </span>
  );
};
