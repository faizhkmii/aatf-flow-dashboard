import { useState } from 'react';
import { Search, Gauge, CheckCircle, ListChecks, Filter } from 'lucide-react';
import { Vehicle, FacilityCapacity, calculateMetrics, formatDuration } from '../utils/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ExcavatorDismantlingDashboardProps {
  vehicles: Vehicle[];
  facilityCapacity: FacilityCapacity[];
}

export function ExcavatorDismantlingDashboard({ vehicles, facilityCapacity }: ExcavatorDismantlingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<string>('all');

  const filteredByFacility = selectedFacility === 'all' ? vehicles : vehicles.filter(v => v.facility === selectedFacility);

  const readyVehicles = filteredByFacility.filter(v => v.status === 'sent_to_yard');
  const inProgressVehicles = filteredByFacility.filter(v => v.status === 'excavator_dismantling');
  const completedVehicles = filteredByFacility.filter(v => v.status === 'vehicle_dismantled');

  const filteredReady = readyVehicles.filter(
    v =>
      v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInProgress = inProgressVehicles.filter(
    v =>
      v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgExcavatorTime = completedVehicles.length > 0
    ? completedVehicles.reduce((sum, v) => {
        const metrics = calculateMetrics(v);
        return sum + (metrics.excavatorDuration || 0);
      }, 0) / completedVehicles.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Facility Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-foreground">Filter by Facility:</span>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Ready to Dismantle</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-500">
              <ListChecks className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{readyVehicles.length}</div>
          <div className="text-xs text-muted-foreground mt-1">In yard queue</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">In Progress</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-500">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{inProgressVehicles.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Being dismantled</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Completed</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{completedVehicles.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Fully processed</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Avg Processing Time</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{formatDuration(avgExcavatorTime)}</div>
          <div className="text-xs text-muted-foreground mt-1">Excavator duration</div>
        </div>
      </div>

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
        <div className="bg-card rounded-lg border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-foreground">
              Ready to Dismantle ({filteredReady.length})
            </h3>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {filteredReady.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No vehicles ready for excavator dismantling
              </div>
            ) : (
              filteredReady.map(vehicle => {
                const waitTime = vehicle.timestamps.sentToYard
                  ? (new Date().getTime() - vehicle.timestamps.sentToYard.getTime()) / 60000
                  : null;

                return (
                  <div key={vehicle.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm text-foreground">{vehicle.vehicleNumber}</div>
                        <div className="text-xs text-muted-foreground">{vehicle.id} - {vehicle.vehicleType}</div>
                      </div>
                      <div className="px-2 py-1 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded text-xs border border-red-200 dark:border-red-800/50">
                        Ready
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-muted-foreground">Facility</div>
                        <div className="text-foreground">{vehicle.facility}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Wait Time in Yard</div>
                        <div className="text-foreground">{formatDuration(waitTime)}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-foreground">
              Currently Dismantling ({filteredInProgress.length})
            </h3>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {filteredInProgress.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No vehicles currently being dismantled
              </div>
            ) : (
              filteredInProgress.map(vehicle => {
                const timeInProgress = vehicle.timestamps.excavatorStart
                  ? (new Date().getTime() - vehicle.timestamps.excavatorStart.getTime()) / 60000
                  : null;

                return (
                  <div key={vehicle.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm text-foreground">{vehicle.vehicleNumber}</div>
                        <div className="text-xs text-muted-foreground">{vehicle.id} - {vehicle.vehicleType}</div>
                      </div>
                      <div className="px-2 py-1 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded text-xs border border-amber-200 dark:border-amber-800/50">
                        In Progress
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-muted-foreground">Facility</div>
                        <div className="text-foreground">{vehicle.facility}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Time in Progress</div>
                        <div className="text-foreground">{formatDuration(timeInProgress)}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-foreground">
            Recently Completed ({completedVehicles.length})
          </h3>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {completedVehicles.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No completed vehicles
            </div>
          ) : (
            completedVehicles.map(vehicle => {
              const metrics = calculateMetrics(vehicle);

              return (
                <div key={vehicle.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm text-foreground">{vehicle.vehicleNumber}</div>
                      <div className="text-xs text-muted-foreground">{vehicle.id} - {vehicle.vehicleType}</div>
                    </div>
                    <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded text-xs border border-emerald-200 dark:border-emerald-800/50">
                      Completed
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Facility</div>
                      <div className="text-foreground">{vehicle.facility}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Processing Time</div>
                      <div className="text-foreground">{formatDuration(metrics.excavatorDuration)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Completed At</div>
                      <div className="text-foreground">
                        {vehicle.timestamps.excavatorPhotoCapture?.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
