import { ReactNode } from 'react';
import { Clock, Menu } from 'lucide-react';

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
  timeFilter: 'today' | 'weekly' | 'monthly';
  onTimeFilterChange: (filter: 'today' | 'weekly' | 'monthly') => void;
  lastUpdated: Date;
  onMenuClick: () => void;
}

export function DashboardLayout({
  title,
  children,
  timeFilter,
  onTimeFilterChange,
  lastUpdated,
  onMenuClick
}: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-foreground truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => onTimeFilterChange('today')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm transition-colors ${
                  timeFilter === 'today'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => onTimeFilterChange('weekly')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm transition-colors ${
                  timeFilter === 'weekly'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => onTimeFilterChange('monthly')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm transition-colors ${
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

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
