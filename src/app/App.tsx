import { useState, useEffect } from 'react';
import { LayoutDashboard, Wrench, Car, Activity, TrendingUp, Truck, Sun, Moon, X } from 'lucide-react';
import { DashboardLayout } from './components/DashboardLayout';
import { BodyDismantlingDashboard } from './components/BodyDismantlingDashboard';
import { CarsOnWayDashboard } from './components/CarsOnWayDashboard';
import { ExcavatorDismantlingDashboard } from './components/ExcavatorDismantlingDashboard';
import { OverallDashboard } from './components/OverallDashboard';
import { TowingArrangementDashboard } from './components/TowingArrangementDashboard';
import { ThemeProvider, useTheme } from './utils/ThemeContext';
import { generateMockVehicles, calculateFacilityCapacity } from './utils/mockData';

type DashboardType = 'overall' | 'body-dismantling' | 'cars-on-way' | 'towing-arrangement' | 'excavator';
type TimeFilter = 'today' | 'weekly' | 'monthly';

function AppContent() {
  const [activeDashboard, setActiveDashboard] = useState<DashboardType>('overall');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [vehicles, setVehicles] = useState(() => generateMockVehicles(150, 'today'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const vehicleCount = timeFilter === 'today' ? 150 : timeFilter === 'weekly' ? 500 : 1200;
    setVehicles(generateMockVehicles(vehicleCount, timeFilter));
  }, [timeFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      const vehicleCount = timeFilter === 'today' ? 150 : timeFilter === 'weekly' ? 500 : 1200;
      setVehicles(generateMockVehicles(vehicleCount, timeFilter));
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [timeFilter]);

  const facilityCapacity = calculateFacilityCapacity(vehicles);

  const dashboards = [
    {
      id: 'overall' as DashboardType,
      name: 'Overall Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'Bottleneck analysis'
    },
    {
      id: 'body-dismantling' as DashboardType,
      name: 'Body Dismantling',
      icon: <Wrench className="w-5 h-5" />,
      description: 'Phase 7 tracking'
    },
    {
      id: 'cars-on-way' as DashboardType,
      name: 'Cars On Way & Capacity',
      icon: <Car className="w-5 h-5" />,
      description: 'Transit & capacity'
    },
    {
      id: 'towing-arrangement' as DashboardType,
      name: 'Towing Arrangement',
      icon: <Truck className="w-5 h-5" />,
      description: 'Tow pass & grouping'
    },
    {
      id: 'excavator' as DashboardType,
      name: 'Excavator Dismantling',
      icon: <Activity className="w-5 h-5" />,
      description: 'Phase 9 tracking'
    }
  ];

  const currentDashboardConfig = dashboards.find(d => d.id === activeDashboard);

  const handleNavClick = (id: DashboardType) => {
    setActiveDashboard(id);
    setSidebarOpen(false);
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="flex h-screen bg-background">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-sidebar-foreground">AATF Flow</h1>
                <p className="text-xs text-sidebar-muted">Facility Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded text-sidebar-muted hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {dashboards.map(dashboard => (
                <button
                  key={dashboard.id}
                  onClick={() => handleNavClick(dashboard.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeDashboard === dashboard.id
                      ? 'bg-red-600 text-white'
                      : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  {dashboard.icon}
                  <div>
                    <div className="text-sm">{dashboard.name}</div>
                    <div className="text-xs opacity-75">{dashboard.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-3">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
            </button>
            <div className="flex items-center gap-2 text-xs text-sidebar-muted">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Auto-refresh: 30s
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden min-w-0">
          <DashboardLayout
            title={currentDashboardConfig?.name || 'Dashboard'}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            lastUpdated={lastUpdated}
            onMenuClick={() => setSidebarOpen(true)}
          >
            {activeDashboard === 'overall' && (
              <OverallDashboard vehicles={vehicles} facilityCapacity={facilityCapacity} />
            )}
            {activeDashboard === 'body-dismantling' && (
              <BodyDismantlingDashboard vehicles={vehicles} facilityCapacity={facilityCapacity} />
            )}
            {activeDashboard === 'cars-on-way' && (
              <CarsOnWayDashboard vehicles={vehicles} facilityCapacity={facilityCapacity} />
            )}
            {activeDashboard === 'towing-arrangement' && (
              <TowingArrangementDashboard vehicles={vehicles} facilityCapacity={facilityCapacity} />
            )}
            {activeDashboard === 'excavator' && (
              <ExcavatorDismantlingDashboard vehicles={vehicles} facilityCapacity={facilityCapacity} />
            )}
          </DashboardLayout>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
