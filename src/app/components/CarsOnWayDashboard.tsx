import { AlertTriangle, TrendingUp, Car, Package, Filter, Eye } from 'lucide-react';
import { Vehicle, FacilityCapacity, getStatusLabel, VehicleStatus } from '../utils/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useState } from 'react';
import { getChartStyles } from '../utils/chartStyles';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';

interface CarsOnWayDashboardProps {
  vehicles: Vehicle[];
  facilityCapacity: FacilityCapacity[];
}

const statusColors: Record<string, string> = {
  towing_arrangement: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  on_the_way: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  checked_in: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  depollution_in_progress: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  depollution_done: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  transferred_to_bd: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  dismantling_in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  body_dismantling_done: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  sent_to_yard: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  excavator_dismantling: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  vehicle_dismantled: 'bg-neutral-500/20 text-muted-foreground border-neutral-500/30',
};

export function CarsOnWayDashboard({ vehicles, facilityCapacity }: CarsOnWayDashboardProps) {
  const chartStyles = getChartStyles();
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleDetailOpen, setVehicleDetailOpen] = useState(false);

  const filteredVehicles = selectedFacility === 'all' ? vehicles : vehicles.filter(v => v.facility === selectedFacility);
  const filteredFacilityCapacity = selectedFacility === 'all' ? facilityCapacity : facilityCapacity.filter(f => f.facilityName === selectedFacility);

  const onTheWayVehicles = filteredVehicles.filter(v => v.status === 'on_the_way');

  // Create time-based chart data for vehicles on the way
  const timeChartData = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const vehiclesInHour = onTheWayVehicles.filter(v =>
      v.timestamps.eta &&
      v.timestamps.eta.getTime() >= hour.getTime() &&
      v.timestamps.eta.getTime() < hour.getTime() + 60 * 60 * 1000
    ).length;
    timeChartData.push({
      time: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      vehicles: vehiclesInHour
    });
  }

  const totalCapacity = filteredFacilityCapacity.reduce((sum, f) => sum + f.maxCapacity, 0);
  const totalOccupied = filteredFacilityCapacity.reduce((sum, f) => sum + f.currentCount, 0);
  const capacityPercentage = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

  const facilitiesAtRisk = filteredFacilityCapacity.filter(
    f => (f.currentCount / f.maxCapacity) * 100 >= 80
  );

  const chartData = filteredFacilityCapacity.map(f => ({
    name: f.facilityName,
    current: f.currentCount,
    available: f.maxCapacity - f.currentCount,
    capacity: f.maxCapacity,
    percentage: ((f.currentCount / f.maxCapacity) * 100).toFixed(1)
  }));

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Facility Filter */}
      <div className="flex items-center gap-4 bg-card border border-border rounded-lg p-4">
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

      {/* Capacity Alert */}
      {facilitiesAtRisk.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-600 dark:text-red-400 font-medium">Capacity Alert</h3>
              <p className="text-sm text-red-700 dark:text-red-300/80 mt-1">
                {facilitiesAtRisk.length} {facilitiesAtRisk.length === 1 ? 'facility has' : 'facilities have'} exceeded 80% capacity threshold
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {facilitiesAtRisk.map(f => (
                  <span key={f.facilityName} className="px-2 py-1 bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs border border-red-200 dark:border-red-800/50">
                    {f.facilityName}: {f.currentCount}/{f.maxCapacity} ({((f.currentCount / f.maxCapacity) * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Vehicles On The Way</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-500">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{onTheWayVehicles.length}</div>
          <div className="text-xs text-muted-foreground mt-1">In transit</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Capacity</span>
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalOccupied} / {totalCapacity}</div>
          <div className="text-xs text-muted-foreground mt-1">{capacityPercentage.toFixed(1)}% occupied</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Available Capacity</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalCapacity - totalOccupied}</div>
          <div className="text-xs text-muted-foreground mt-1">Spaces remaining</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">At Risk Facilities</span>
            <div className={`p-2 rounded-lg ${facilitiesAtRisk.length > 0 ? 'bg-red-50 dark:bg-red-950 text-red-500' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{facilitiesAtRisk.length} / {filteredFacilityCapacity.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Above 80% threshold</div>
        </div>
      </div>

      {/* Facility Capacity Chart */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-foreground mb-4">Facility Capacity Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
            <XAxis type="number" stroke={chartStyles.axisColor} />
            <YAxis type="category" dataKey="name" stroke={chartStyles.axisColor} width={50} />
            <Tooltip
              contentStyle={{ backgroundColor: chartStyles.tooltipBg, border: '1px solid ' + chartStyles.tooltipBorder, borderRadius: '8px', color: chartStyles.tooltipColor }}
              formatter={(value: number, name: string) => [value, name === 'current' ? 'Occupied' : 'Available']}
            />
            <Legend />
            <Bar dataKey="current" fill="#dc2626" name="Occupied" stackId="a" />
            <Bar dataKey="available" fill="#404040" name="Available" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vehicles on the Way Chart */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-foreground mb-4">Vehicles on the Way (Last 24 Hours)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
            <XAxis dataKey="time" stroke={chartStyles.axisColor} />
            <YAxis stroke={chartStyles.axisColor} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: chartStyles.tooltipBg, border: '1px solid ' + chartStyles.tooltipBorder, borderRadius: '8px', color: chartStyles.tooltipColor }}
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value: number) => [value, 'Vehicles']}
            />
            <Line type="monotone" dataKey="vehicles" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', stroke: '#dc2626' }} activeDot={{ r: 6, fill: '#ef4444' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Facility Details */}
      <div className="bg-card rounded-lg border border-border">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-foreground">Facility Details</h3>
        </div>
        <div className="divide-y divide-border">
          {filteredFacilityCapacity.map(facility => {
            const percentage = (facility.currentCount / facility.maxCapacity) * 100;
            const facilityVehicles = filteredVehicles.filter(v => v.facility === facility.facilityName);

            // Group vehicles by status
            const vehiclesByStatus = facilityVehicles.reduce((acc, v) => {
              if (!acc[v.status]) acc[v.status] = [];
              acc[v.status].push(v);
              return acc;
            }, {} as Record<string, Vehicle[]>);

            return (
              <div key={facility.facilityName} className="px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{facility.facilityName}</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-muted border-border text-foreground hover:bg-muted hover:text-foreground">
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl bg-card border-border text-foreground">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">{facility.facilityName} - Detailed Status</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Vehicles</div>
                            <div className="text-2xl font-bold text-foreground">{facilityVehicles.length}</div>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Capacity Used</div>
                            <div className="text-2xl font-bold text-foreground">{facility.currentCount}/{facility.maxCapacity}</div>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Utilization</div>
                            <div className={`text-2xl font-bold ${percentage >= 80 ? 'text-red-400' : percentage >= 60 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Status Breakdown with Vehicle Lists */}
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-3">Vehicles by Status</h4>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {Object.entries(vehiclesByStatus).map(([status, statusVehicles]) => (
                              <div key={status} className="border border-border rounded-lg overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-2 bg-muted">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs border ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>
                                      {getStatusLabel(status as VehicleStatus)}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="bg-muted text-muted-foreground">{statusVehicles.length}</Badge>
                                </div>
                                <div className="divide-y divide-border">
                                  {statusVehicles.slice(0, 5).map(vehicle => (
                                    <div
                                      key={vehicle.id}
                                      className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                                      onClick={() => handleVehicleClick(vehicle)}
                                    >
                                      <div>
                                        <div className="text-sm font-medium text-foreground">{vehicle.vehicleNumber}</div>
                                        <div className="text-xs text-muted-foreground">{vehicle.vehicleType} - {vehicle.towingType}</div>
                                      </div>
                                      <Badge variant="outline" className={`text-xs ${vehicle.towingType === 'towtruck' ? 'border-red-600 text-red-400' : vehicle.towingType === 'carrier' ? 'border-blue-600 text-blue-400' : 'border-yellow-600 text-yellow-400'}`}>
                                        {vehicle.towingType}
                                      </Badge>
                                    </div>
                                  ))}
                                  {statusVehicles.length > 5 && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                                      +{statusVehicles.length - 5} more vehicles
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Status pill summary */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {facility.byStatus.slice(0, 4).map(s => (
                    <span key={s.status} className={`px-1.5 py-0.5 rounded text-[10px] border ${statusColors[s.status] || 'bg-muted text-muted-foreground'}`}>
                      {getStatusLabel(s.status).split(' ').map(w => w[0]).join('')}: {s.count}
                    </span>
                  ))}
                  {facility.byStatus.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                      +{facility.byStatus.length - 4} more
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      percentage >= 80
                        ? 'bg-red-600'
                        : percentage >= 60
                        ? 'bg-red-500'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {percentage.toFixed(1)}% capacity ({facility.currentCount}/{facility.maxCapacity})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicle Detail Dialog */}
      <Dialog open={vehicleDetailOpen} onOpenChange={setVehicleDetailOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Vehicle Details</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Vehicle Number</div>
                  <div className="text-sm font-medium text-foreground">{selectedVehicle.vehicleNumber}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Vehicle Type</div>
                  <div className="text-sm font-medium text-foreground">{selectedVehicle.vehicleType}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Facility</div>
                  <div className="text-sm font-medium text-foreground">{selectedVehicle.facility}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Towing Type</div>
                  <div className="text-sm font-medium text-foreground capitalize">{selectedVehicle.towingType}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg col-span-2">
                  <div className="text-xs text-muted-foreground">Current Status</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs border ${statusColors[selectedVehicle.status]}`}>
                    {getStatusLabel(selectedVehicle.status)}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Timeline</h4>
                <div className="space-y-1">
                  {selectedVehicle.timestamps.towingArrangement && (
                    <TimelineRow label="Towing Arranged" time={selectedVehicle.timestamps.towingArrangement} />
                  )}
                  {selectedVehicle.timestamps.eta && (
                    <TimelineRow label="ETA" time={selectedVehicle.timestamps.eta} />
                  )}
                  {selectedVehicle.timestamps.checkedIn && (
                    <TimelineRow label="Checked In" time={selectedVehicle.timestamps.checkedIn} />
                  )}
                  {selectedVehicle.timestamps.depollutionStart && (
                    <TimelineRow label="Depollution Start" time={selectedVehicle.timestamps.depollutionStart} />
                  )}
                  {selectedVehicle.timestamps.depollutionEnd && (
                    <TimelineRow label="Depollution End" time={selectedVehicle.timestamps.depollutionEnd} />
                  )}
                  {selectedVehicle.timestamps.bodyDismantlingStart && (
                    <TimelineRow label="Dismantling Start" time={selectedVehicle.timestamps.bodyDismantlingStart} />
                  )}
                  {selectedVehicle.timestamps.bodyDismantlingEnd && (
                    <TimelineRow label="Dismantling End" time={selectedVehicle.timestamps.bodyDismantlingEnd} />
                  )}
                  {selectedVehicle.timestamps.sentToYard && (
                    <TimelineRow label="Sent to Yard" time={selectedVehicle.timestamps.sentToYard} />
                  )}
                  {selectedVehicle.timestamps.excavatorStart && (
                    <TimelineRow label="Excavator Start" time={selectedVehicle.timestamps.excavatorStart} />
                  )}
                  {selectedVehicle.timestamps.excavatorPhotoCapture && (
                    <TimelineRow label="Photo Capture" time={selectedVehicle.timestamps.excavatorPhotoCapture} />
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimelineRow({ label, time }: { label: string; time: Date }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground font-mono">{time.toLocaleString()}</span>
    </div>
  );
}

