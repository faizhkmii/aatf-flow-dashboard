import { ReactNode } from 'react';
import { Clock } from 'lucide-react';

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
  timeFilter: 'today' | 'weekly' | 'monthly';
  onTimeFilterChange: (filter: 'today' | 'weekly' | 'monthly') => void;
  lastUpdated: Date;
}

export function DashboardLayout({
  title,
  children,
  timeFilter,
  onTimeFilterChange,
  lastUpdated
}: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-foreground">{title}</h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>

            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => onTimeFilterChange('today')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  timeFilter === 'today'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => onTimeFilterChange('weekly')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  timeFilter === 'weekly'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => onTimeFilterChange('monthly')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  timeFilter === 'monthly'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  );
}
