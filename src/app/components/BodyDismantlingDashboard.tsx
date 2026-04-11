import { useState } from 'react';
import { Search, Clock, Timer, Filter, MapPin, List } from 'lucide-react';
import { Vehicle, FacilityCapacity, calculateMetrics, formatDuration } from '../utils/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DismantlingBayMap } from './DismantlingBayMap';

interface BodyDismantlingDashboardProps {
  vehicles: Vehicle[];
  facilityCapacity: FacilityCapacity[];
}

export function BodyDismantlingDashboard({ vehicles, facilityCapacity }: BodyDismantlingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [stoppedVehicleIds, setStoppedVehicleIds] = useState<Set<string>>(new Set());

  const filteredByFacility = selectedFacility === 'all' ? vehicles : vehicles.filter(v => v.facility === selectedFacility);

  // Override status for stopped vehicles so they move from in-progress to completed
  const effectiveVehicles = filteredByFacility.map(v => {
    if (stoppedVehicleIds.has(v.id) && v.status === 'dismantling_in_progress') {
      return {
        ...v,
        status: 'body_dismantling_done' as const,
        timestamps: { ...v.timestamps, bodyDismantlingEnd: new Date() }
      };
    }
    return v;
  });

  const inProgressVehicles = effectiveVehicles.filter(
    v => v.status === 'dismantling_in_progress'
  );

  const completedVehicles = effectiveVehicles.filter(
    v => v.status === 'body_dismantling_done'
  );

  const filteredInProgress = inProgressVehicles.filter(
    v =>
      v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompleted = completedVehicles.filter(
    v =>
      v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgWaitTime = inProgressVehicles.length > 0
    ? inProgressVehicles.reduce((sum, v) => {
        const metrics = calculateMetrics(v);
        return sum + (metrics.transferTimeDepollutionToBD || 0);
      }, 0) / inProgressVehicles.length
    : 0;

  const avgDismantlingTime = completedVehicles.length > 0
    ? completedVehicles.reduce((sum, v) => {
        const metrics = calculateMetrics(v);
        return sum + (metrics.bodyDismantlingDuration || 0);
      }, 0) / completedVehicles.length
    : 0;

  const handleStopTimer = (vehicleId: string) => {
    setStoppedVehicleIds(prev => new Set(prev).add(vehicleId));
  };

  return (
    <div className="space-y-6">
      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 sm:gap-4 bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-foreground">Facility:</span>
          </div>
          <Select value={selectedFacility} onValueChange={setSelectedFacility}>
            <SelectTrigger className="w-48 bg-muted border-border text-foreground">
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Facilities</SelectItem>
              {facilityCapacity.map(f => (
                <SelectItem key={f.facilityName} value={f.facilityName}>
                  {f.facilityName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === 'map'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Bay Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === 'list'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List View
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Bays Occupied"
          value={selectedFacility === 'all'
            ? `${Math.min(inProgressVehicles.length, 24)} / 24`
            : `${Math.min(inProgressVehicles.length, 8)} / 8`
          }
          subtitle={selectedFacility === 'all'
            ? '8 bays x 3 facilities'
            : (inProgressVehicles.length > 8 ? `${inProgressVehicles.length - 8} in queue` : 'Dismantling bays')
          }
          icon={<Timer className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Completed"
          value={completedVehicles.length}
          icon={<Clock className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Avg Wait Time"
          value={formatDuration(avgWaitTime)}
          subtitle="Before dismantling"
          color="amber"
        />
        <StatCard
          title="Avg Dismantling Time"
          value={formatDuration(avgDismantlingTime)}
          subtitle="Body dismantling"
          color="neutral"
        />
      </div>

      {/* Bay Map View */}
      {viewMode === 'map' && (
        <DismantlingBayMap
          vehicles={effectiveVehicles}
          selectedFacility={selectedFacility}
          onStopTimer={handleStopTimer}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by vehicle number or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VehicleSection
              title="Dismantling In Progress"
              vehicles={filteredInProgress}
              showProgress
            />
            <VehicleSection
              title="Body Dismantling Done"
              vehicles={filteredCompleted}
              showProgress={false}
            />
          </div>
        </>
      )}

      {/* Queue (vehicles waiting for a bay) - shown in map mode only */}
      {viewMode === 'map' && inProgressVehicles.length > 8 && (
        <div className="bg-card rounded-lg border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-foreground">
              Queue - Waiting for Bay ({inProgressVehicles.length - 8})
            </h3>
          </div>
          <div className="divide-y divide-border max-h-48 overflow-y-auto">
            {inProgressVehicles.slice(8).map(vehicle => (
              <div key={vehicle.id} className="px-4 py-2 flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground">{vehicle.vehicleNumber}</span>
                  <span className="text-xs text-muted-foreground ml-2">{vehicle.vehicleType}</span>
                </div>
                <span className="text-xs text-muted-foreground">{vehicle.facility}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed list - always shown in map mode */}
      {viewMode === 'map' && completedVehicles.length > 0 && (
        <div className="bg-card rounded-lg border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-foreground">
              Recently Completed ({completedVehicles.length})
            </h3>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {completedVehicles.slice(0, 10).map(vehicle => {
              const metrics = calculateMetrics(vehicle);
              return (
                <div key={vehicle.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-foreground">{vehicle.vehicleNumber}</div>
                      <div className="text-xs text-muted-foreground">{vehicle.vehicleType} - {vehicle.facility}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-foreground">{formatDuration(metrics.bodyDismantlingDuration)}</div>
                      <div className="text-xs text-muted-foreground">dismantling time</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color: 'red' | 'emerald' | 'amber' | 'neutral';
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    red: 'bg-red-50 dark:bg-red-950 text-red-500',
    emerald: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-500',
    amber: 'bg-amber-50 dark:bg-amber-950 text-amber-500',
    neutral: 'bg-muted text-muted-foreground'
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon && <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}

interface VehicleSectionProps {
  title: string;
  vehicles: Vehicle[];
  showProgress: boolean;
}

function VehicleSection({ title, vehicles, showProgress }: VehicleSectionProps) {
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-foreground">
          {title} ({vehicles.length})
        </h3>
      </div>
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {vehicles.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            No vehicles found
          </div>
        ) : (
          vehicles.map(vehicle => (
            <VehicleRow key={vehicle.id} vehicle={vehicle} showProgress={showProgress} />
          ))
        )}
      </div>
    </div>
  );
}

function VehicleRow({ vehicle, showProgress }: { vehicle: Vehicle; showProgress: boolean }) {
  const metrics = calculateMetrics(vehicle);
  const now = new Date();

  let timeInProgress: number | null = null;
  if (showProgress && vehicle.timestamps.bodyDismantlingStart) {
    timeInProgress = (now.getTime() - vehicle.timestamps.bodyDismantlingStart.getTime()) / 60000;
  }

  return (
    <div className="px-4 py-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-foreground text-sm">{vehicle.vehicleNumber}</div>
          <div className="text-xs text-muted-foreground">{vehicle.id} - {vehicle.vehicleType}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Facility</div>
          <div className="text-sm text-foreground">{vehicle.facility}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {showProgress && (
          <>
            <div>
              <div className="text-muted-foreground">Time in Progress</div>
              <div className="text-foreground">{formatDuration(timeInProgress)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Wait Time (Before BD)</div>
              <div className="text-foreground">{formatDuration(metrics.transferTimeDepollutionToBD)}</div>
            </div>
          </>
        )}
        {!showProgress && (
          <>
            <div>
              <div className="text-muted-foreground">Dismantling Duration</div>
              <div className="text-foreground">{formatDuration(metrics.bodyDismantlingDuration)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Transfer Wait Time</div>
              <div className="text-foreground">{formatDuration(metrics.transferTimeBDToYard)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
