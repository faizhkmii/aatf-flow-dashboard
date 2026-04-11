// Top-down bird's eye view SVG of vehicles
// Colors are assigned based on vehicleType to visually differentiate

const vehicleColors: Record<string, { body: string; accent: string }> = {
  Sedan: { body: '#6b7280', accent: '#4b5563' },   // gray
  SUV: { body: '#dc2626', accent: '#991b1b' },       // red
  Truck: { body: '#2563eb', accent: '#1d4ed8' },     // blue
  Van: { body: '#eab308', accent: '#a16207' },        // yellow
};

interface VehicleTopViewProps {
  vehicleType: string;
  className?: string;
}

export function VehicleTopView({ vehicleType, className = '' }: VehicleTopViewProps) {
  const colors = vehicleColors[vehicleType] || vehicleColors.Sedan;

  if (vehicleType === 'SUV') {
    return <SUVView colors={colors} className={className} />;
  }
  if (vehicleType === 'Truck') {
    return <TruckView colors={colors} className={className} />;
  }
  if (vehicleType === 'Van') {
    return <VanView colors={colors} className={className} />;
  }
  return <SedanView colors={colors} className={className} />;
}

function SedanView({ colors, className }: { colors: { body: string; accent: string }; className: string }) {
  return (
    <svg viewBox="0 0 80 160" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="10" y="10" width="60" height="140" rx="20" ry="20" fill={colors.body} />
      {/* Windshield */}
      <rect x="16" y="28" width="48" height="30" rx="6" fill="#1f2937" opacity="0.85" />
      {/* Rear window */}
      <rect x="16" y="100" width="48" height="26" rx="6" fill="#1f2937" opacity="0.85" />
      {/* Hood line */}
      <line x1="18" y1="65" x2="62" y2="65" stroke={colors.accent} strokeWidth="1.5" opacity="0.5" />
      {/* Roof highlight */}
      <rect x="22" y="62" width="36" height="34" rx="4" fill={colors.body} stroke="white" strokeWidth="0.5" opacity="0.3" />
      {/* Side mirrors */}
      <ellipse cx="6" cy="42" rx="5" ry="4" fill={colors.accent} />
      <ellipse cx="74" cy="42" rx="5" ry="4" fill={colors.accent} />
      {/* Headlights */}
      <rect x="16" y="12" width="12" height="6" rx="2" fill="#fbbf24" opacity="0.7" />
      <rect x="52" y="12" width="12" height="6" rx="2" fill="#fbbf24" opacity="0.7" />
      {/* Taillights */}
      <rect x="16" y="142" width="12" height="5" rx="2" fill="#ef4444" opacity="0.8" />
      <rect x="52" y="142" width="12" height="5" rx="2" fill="#ef4444" opacity="0.8" />
    </svg>
  );
}

function SUVView({ colors, className }: { colors: { body: string; accent: string }; className: string }) {
  return (
    <svg viewBox="0 0 90 170" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Body - wider and boxier */}
      <rect x="8" y="8" width="74" height="154" rx="16" ry="16" fill={colors.body} />
      {/* Windshield */}
      <rect x="15" y="28" width="60" height="32" rx="5" fill="#1f2937" opacity="0.85" />
      {/* Rear window */}
      <rect x="15" y="108" width="60" height="28" rx="5" fill="#1f2937" opacity="0.85" />
      {/* Roof rails */}
      <line x1="14" y1="35" x2="14" y2="130" stroke="#d1d5db" strokeWidth="2" />
      <line x1="76" y1="35" x2="76" y2="130" stroke="#d1d5db" strokeWidth="2" />
      {/* Hood line */}
      <line x1="18" y1="68" x2="72" y2="68" stroke={colors.accent} strokeWidth="1.5" opacity="0.5" />
      {/* Roof */}
      <rect x="20" y="64" width="50" height="40" rx="4" fill={colors.body} stroke="white" strokeWidth="0.8" opacity="0.25" />
      {/* Side mirrors */}
      <ellipse cx="4" cy="44" rx="5" ry="5" fill={colors.accent} />
      <ellipse cx="86" cy="44" rx="5" ry="5" fill={colors.accent} />
      {/* Headlights */}
      <rect x="15" y="10" width="14" height="7" rx="3" fill="#fbbf24" opacity="0.7" />
      <rect x="61" y="10" width="14" height="7" rx="3" fill="#fbbf24" opacity="0.7" />
      {/* Taillights */}
      <rect x="15" y="152" width="14" height="6" rx="2" fill="#ef4444" opacity="0.8" />
      <rect x="61" y="152" width="14" height="6" rx="2" fill="#ef4444" opacity="0.8" />
    </svg>
  );
}

function TruckView({ colors, className }: { colors: { body: string; accent: string }; className: string }) {
  return (
    <svg viewBox="0 0 90 180" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Bed */}
      <rect x="10" y="60" width="70" height="110" rx="4" fill={colors.accent} />
      {/* Bed lines */}
      <line x1="25" y1="65" x2="25" y2="165" stroke={colors.body} strokeWidth="1" opacity="0.3" />
      <line x1="45" y1="65" x2="45" y2="165" stroke={colors.body} strokeWidth="1" opacity="0.3" />
      <line x1="65" y1="65" x2="65" y2="165" stroke={colors.body} strokeWidth="1" opacity="0.3" />
      {/* Cabin */}
      <rect x="8" y="8" width="74" height="58" rx="14" ry="14" fill={colors.body} />
      {/* Windshield */}
      <rect x="15" y="16" width="60" height="24" rx="5" fill="#1f2937" opacity="0.85" />
      {/* Cabin rear window */}
      <rect x="15" y="44" width="60" height="14" rx="4" fill="#1f2937" opacity="0.6" />
      {/* Side mirrors */}
      <ellipse cx="3" cy="30" rx="5" ry="5" fill={colors.accent} />
      <ellipse cx="87" cy="30" rx="5" ry="5" fill={colors.accent} />
      {/* Headlights */}
      <rect x="14" y="9" width="14" height="6" rx="2" fill="#fbbf24" opacity="0.7" />
      <rect x="62" y="9" width="14" height="6" rx="2" fill="#fbbf24" opacity="0.7" />
      {/* Taillights */}
      <rect x="14" y="164" width="14" height="6" rx="2" fill="#ef4444" opacity="0.8" />
      <rect x="62" y="164" width="14" height="6" rx="2" fill="#ef4444" opacity="0.8" />
    </svg>
  );
}

function VanView({ colors, className }: { colors: { body: string; accent: string }; className: string }) {
  return (
    <svg viewBox="0 0 86 170" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Body - tall and boxy */}
      <rect x="8" y="8" width="70" height="154" rx="12" ry="12" fill={colors.body} />
      {/* Windshield */}
      <rect x="14" y="22" width="58" height="28" rx="5" fill="#1f2937" opacity="0.85" />
      {/* Side windows */}
      <rect x="14" y="56" width="58" height="18" rx="3" fill="#1f2937" opacity="0.5" />
      <rect x="14" y="80" width="58" height="18" rx="3" fill="#1f2937" opacity="0.5" />
      {/* Rear window */}
      <rect x="20" y="130" width="46" height="20" rx="4" fill="#1f2937" opacity="0.6" />
      {/* Roof highlight */}
      <rect x="18" y="55" width="50" height="50" rx="3" fill={colors.body} stroke="white" strokeWidth="0.5" opacity="0.15" />
      {/* Side mirrors */}
      <ellipse cx="4" cy="36" rx="5" ry="4" fill={colors.accent} />
      <ellipse cx="82" cy="36" rx="5" ry="4" fill={colors.accent} />
      {/* Headlights */}
      <rect x="14" y="10" width="12" height="6" rx="2" fill="#fbbf24" opacity="0.7" />
      <rect x="60" y="10" width="12" height="6" rx="2" fill="#fbbf24" opacity="0.7" />
      {/* Taillights */}
      <rect x="14" y="154" width="12" height="5" rx="2" fill="#ef4444" opacity="0.8" />
      <rect x="60" y="154" width="12" height="5" rx="2" fill="#ef4444" opacity="0.8" />
    </svg>
  );
}
