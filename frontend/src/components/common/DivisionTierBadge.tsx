import React from 'react';
import { Gem, Shield, Star, Trophy } from 'lucide-react';
import './DivisionTierBadge.css';

interface DivisionTierBadgeProps {
  tier: string;
  className?: string;
}

const tierIcons = {
  Diamond: Gem,
  Platinum: Star,
  Gold: Trophy,
} as const;

export const DivisionTierBadge: React.FC<DivisionTierBadgeProps> = ({ tier, className = '' }) => {
  const Icon = tierIcons[tier as keyof typeof tierIcons];

  if (!Icon) {
    return <span className={`division-tier-empty ${className}`.trim()}>{tier || '-'}</span>;
  }

  return (
    <span className={`division-tier-badge division-tier-badge--${tier.toLowerCase()} ${className}`.trim()}>
      <span className="division-tier-badge__emblem" aria-hidden="true">
        <Shield className="division-tier-badge__shield" />
        <Icon className="division-tier-badge__icon" />
      </span>
      <span className="division-tier-badge__label">{tier}</span>
      <span className="division-tier-badge__shine" aria-hidden="true" />
    </span>
  );
};
