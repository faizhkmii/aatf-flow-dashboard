import { Truck, Copy, X, Filter, FileText, Search, MapPin } from 'lucide-react';
import { Vehicle, FacilityCapacity, getStatusLabel } from '../utils/mockData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useState } from 'react';
import { getChartStyles } from '../utils/chartStyles';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';

interface TowingArrangementDashboardProps {
  vehicles: Vehicle[];
  facilityCapacity: FacilityCapacity[];
}

// Mock towing companies
const towingCompanies = ['Chin Hua Towing', 'Panjang Towing', 'Hao Towing', 'KL Tow Services', 'Rapid Tow'];

function getTowingCompany(vehicleId: string): string {
  const idx = vehicleId.charCodeAt(vehicleId.length - 1) % towingCompanies.length;
  return towingCompanies[idx];
}

function getLocation(vehicleId: string): string {
  const locations = ['Kuantan', 'Kedah', 'JB', 'KL', 'Penang', 'Ipoh', 'Melaka'];
  const idx = vehicleId.charCodeAt(vehicleId.length - 2) % locations.length;
  return locations[idx];
}

export function TowingArrangementDashboard({ vehicles, facilityCapacity }: TowingArrangementDashboardProps) {
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [towingTypeFilter, setTowingTypeFilter] = useState<string>('all');
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [towPassDialog, setTowPassDialog] = useState<{ open: boolean; towPass?: string }>({ open: false });
  const [searchTerm, setSearchTerm] = useState('');

  const chartStyles = getChartStyles();

  const filteredVehicles = selectedFacility === 'all' ? vehicles : vehicles.filter(v => v.facility === selectedFacility);
  const towingArrangementVehicles = filteredVehicles.filter(v => v.status === 'towing_arrangement');
  const onTheWayVehicles = filteredVehicles.filter(v => v.status === 'on_the_way');

  const filteredByTowing = (towingTypeFilter === 'all'
    ? towingArrangementVehicles
    : towingArrangementVehicles.filter(v => v.towingType === towingTypeFilter)
  ).filter(v =>
    v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Counts
  const towtruckTotal = filteredVehicles.filter(v => v.towingType === 'towtruck').length;
  const trailerTotal = filteredVehicles.filter(v => v.towingType === 'trailer').length;
  const carrierTotal = filteredVehicles.filter(v => v.towingType === 'carrier').length;
  const towtruckAwaiting = towingArrangementVehicles.filter(v => v.towingType === 'towtruck').length;
  const trailerAwaiting = towingArrangementVehicles.filter(v => v.towingType === 'trailer').length;
  const carrierAwaiting = towingArrangementVehicles.filter(v => v.towingType === 'carrier').length;

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicles(prev => {
      if (prev.find(v => v.id === vehicle.id)) {
        return prev.filter(v => v.id !== vehicle.id);
      }
      if (prev.length >= 6) return prev; // cap at 6
      return [...prev, vehicle];
    });
  };

  const generateTowPass = (vehicle: Vehicle) => {
    const towPass = `══════════════════════════════════
          TOW PASS
══════════════════════════════════
Vehicle No:    ${vehicle.vehicleNumber}
Vehicle Type:  ${vehicle.vehicleType}
Facility:      ${vehicle.facility}
Towing Type:   ${vehicle.towingType.toUpperCase()}
Towing Co:     ${getTowingCompany(vehicle.id)}
Location:      ${getLocation(vehicle.id)}

ETA:           ${vehicle.timestamps.eta ? vehicle.timestamps.eta.toLocaleString() : 'TBD'}
Status:        ${getStatusLabel(vehicle.status)}

──────────────────────────────────
Please present this pass upon
arrival at the facility gate.
══════════════════════════════════`;

    setTowPassDialog({ open: true, towPass });
  };

  const generateGroupedTowPass = () => {
    if (selectedVehicles.length === 0) return;

    const facility = selectedVehicles[0].facility;
    const towingType = selectedVehicles[0].towingType;

    const towPass = `══════════════════════════════════
      GROUP TOW PASS
══════════════════════════════════
Towing Type:   ${towingType.toUpperCase()}
Facility:      ${facility}
Total Vehicles: ${selectedVehicles.length}

──── Vehicle Manifest ────
${selectedVehicles.map((v, i) => `${i + 1}. ${v.vehicleNumber} (${v.vehicleType}) - ${getLocation(v.id)}`).join('\n')}

ETA:           ${selectedVehicles[0].timestamps.eta ? selectedVehicles[0].timestamps.eta.toLocaleString() : 'TBD'}

──────────────────────────────────
Present this pass upon arrival.
All listed vehicles must be on
the ${towingType} upon arrival.
══════════════════════════════════`;

    setTowPassDialog({ open: true, towPass });
    setSelectedVehicles([]);
  };

  const canGroupVehicles = selectedVehicles.length > 1 &&
    selectedVehicles.length <= 6 &&
    selectedVehicles.every(v => v.towingType !== 'towtruck') &&
    selectedVehicles.every(v => v.towingType === selectedVehicles[0].towingType) &&
    selectedVehicles.every(v => v.facility === selectedVehicles[0].facility);

  const groupError = selectedVehicles.length > 1 && !canGroupVehicles
    ? selectedVehicles.length > 6
      ? 'Maximum 6 vehicles per batch'
      : !selectedVehicles.every(v => v.towingType === selectedVehicles[0].towingType)
      ? 'All vehicles must be the same towing type'
      : null
    : null;

  return (
    <div className="space-y-6">
      {/* Facility Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-card border border-border rounded-lg p-3 sm:p-4">
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

      {/* Main Layout: Left = Towing List, Right = Facility Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Towing type cards + Vehicle list */}
        <div className="lg:col-span-3 space-y-4">
          {/* Towing type summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTowingTypeFilter(towingTypeFilter === 'towtruck' ? 'all' : 'towtruck')}
              className={`p-3 sm:p-4 rounded-lg border text-center transition-colors ${
                towingTypeFilter === 'towtruck'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/50 hover:border-red-400'
              }`}
            >
              <div className={`text-xl sm:text-2xl font-bold ${towingTypeFilter === 'towtruck' ? 'text-white' : 'text-foreground'}`}>
                {towtruckAwaiting} / {towtruckTotal}
              </div>
              <div className={`text-xs font-medium mt-0.5 ${towingTypeFilter === 'towtruck' ? 'text-red-100' : 'text-muted-foreground'}`}>
                TOW TRUCK
              </div>
            </button>
            <button
              onClick={() => setTowingTypeFilter(towingTypeFilter === 'trailer' ? 'all' : 'trailer')}
              className={`p-3 sm:p-4 rounded-lg border text-center transition-colors ${
                towingTypeFilter === 'trailer'
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50 hover:border-amber-400'
              }`}
            >
              <div className={`text-xl sm:text-2xl font-bold ${towingTypeFilter === 'trailer' ? 'text-white' : 'text-foreground'}`}>
                {trailerAwaiting} / {trailerTotal}
              </div>
              <div className={`text-xs font-medium mt-0.5 ${towingTypeFilter === 'trailer' ? 'text-amber-100' : 'text-muted-foreground'}`}>
                TRAILER
              </div>
            </button>
            <button
              onClick={() => setTowingTypeFilter(towingTypeFilter === 'carrier' ? 'all' : 'carrier')}
              className={`p-3 sm:p-4 rounded-lg border text-center transition-colors ${
                towingTypeFilter === 'carrier'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/50 hover:border-blue-400'
              }`}
            >
              <div className={`text-xl sm:text-2xl font-bold ${towingTypeFilter === 'carrier' ? 'text-white' : 'text-foreground'}`}>
                {carrierAwaiting} / {carrierTotal}
              </div>
              <div className={`text-xs font-medium mt-0.5 ${towingTypeFilter === 'carrier' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                CARRIER
              </div>
            </button>
          </div>

          {/* Vehicle List Card */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-foreground font-medium">List of Vehicles</h3>
                <span className="text-xs text-muted-foreground">({filteredByTowing.length})</span>
                {towingTypeFilter !== 'all' && (
                  <Badge variant="outline" className={`text-[10px] ${
                    towingTypeFilter === 'towtruck' ? 'border-red-500 text-red-500' :
                    towingTypeFilter === 'carrier' ? 'border-blue-500 text-blue-500' :
                    'border-amber-500 text-amber-500'
                  }`}>
                    {towingTypeFilter}
                  </Badge>
                )}
              </div>
              {(canGroupVehicles || (selectedVehicles.length === 1 && selectedVehicles[0].towingType === 'towtruck')) && (
                <Button
                  size="sm"
                  onClick={canGroupVehicles ? generateGroupedTowPass : () => generateTowPass(selectedVehicles[0])}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {canGroupVehicles ? `Batch Generate Tow Pass (${selectedVehicles.length})` : 'Generate Tow Pass'}
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="px-4 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search plate number..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Selection bar */}
            {selectedVehicles.length > 0 && (
              <div className="px-4 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
                <div className="text-xs text-foreground">
                  <span className="font-medium">{selectedVehicles.length}/6</span> selected
                  {selectedVehicles.length === 1 && selectedVehicles[0].towingType !== 'towtruck' && (
                    <span className="text-muted-foreground ml-1">- select more to group</span>
                  )}
                  {groupError && (
                    <span className="text-red-500 ml-2">{groupError}</span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedVehicles([])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              </div>
            )}

            {/* Vehicle rows */}
            <div className="divide-y divide-border">
              {filteredByTowing.length === 0 ? (
                <div className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No vehicles requiring towing arrangement
                </div>
              ) : (
                filteredByTowing.map(vehicle => {
                  const isSelected = selectedVehicles.some(v => v.id === vehicle.id);
                  return (
                    <div
                      key={vehicle.id}
                      className={`px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors ${isSelected ? 'bg-muted/30' : ''}`}
                    >
                      {/* Checkbox for carrier/trailer */}
                      {vehicle.towingType !== 'towtruck' ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleVehicleSelect(vehicle)}
                          className="w-4 h-4 rounded border-border bg-muted text-red-600 focus:ring-red-500 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-4 flex-shrink-0" />
                      )}

                      {/* Vehicle info */}
                      <div className="flex-1 min-w-0 grid grid-cols-3 sm:grid-cols-4 gap-2 items-center">
                        <div>
                          <div className="text-sm font-bold text-foreground">{vehicle.vehicleNumber}</div>
                          <div className="text-[10px] text-muted-foreground">{vehicle.vehicleType}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {getLocation(vehicle.id)}
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-xs text-muted-foreground">{getTowingCompany(vehicle.id)}</div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          {/* Towing type indicator */}
                          <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${
                            vehicle.towingType === 'towtruck' ? 'bg-red-500' :
                            vehicle.towingType === 'carrier' ? 'bg-blue-500' :
                            'bg-amber-500'
                          }`} />
                          {vehicle.towingType === 'towtruck' && (
                            <Button
                              size="sm"
                              onClick={() => generateTowPass(vehicle)}
                              className="bg-red-600 hover:bg-red-700 text-white text-[10px] h-6 px-2"
                            >
                              Generate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Facility Occupancy */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-foreground font-medium">Facility Occupancy</h3>
            </div>
            <div className="p-4 space-y-6">
              {facilityCapacity.map(f => {
                const percentage = Math.round((f.currentCount / f.maxCapacity) * 100);
                const available = f.maxCapacity - f.currentCount;
                const data = [
                  { name: 'Occupied', value: f.currentCount },
                  { name: 'Available', value: available },
                ];
                return (
                  <div key={f.facilityName} className="flex items-center gap-4">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="85%"
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            strokeWidth={0}
                          >
                            <Cell fill="#dc2626" />
                            <Cell fill="var(--muted)" />
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: chartStyles.tooltipBg, border: '1px solid ' + chartStyles.tooltipBorder, borderRadius: '8px', color: chartStyles.tooltipColor, fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{f.facilityName}</div>
                      <div className="text-2xl font-bold text-foreground mt-0.5">{percentage}%</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {f.currentCount} occupied / {f.maxCapacity} total
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full ${percentage >= 80 ? 'bg-red-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex items-center gap-4 pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded bg-muted border border-border" />
                  <span>Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* In Transit Summary */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Truck className="w-4 h-4 text-red-500" />
              Currently In Transit
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-foreground">{onTheWayVehicles.length}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Total</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-foreground">{towingArrangementVehicles.length}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Awaiting</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-foreground">{selectedVehicles.length}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Selected</div>
              </div>
            </div>
          </div>

          {/* Towing type legend */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Towing Types</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500" />
                  <span className="text-xs text-foreground">Tow Truck</span>
                </div>
                <span className="text-xs text-muted-foreground">Direct pass generation</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-amber-500" />
                  <span className="text-xs text-foreground">Trailer</span>
                </div>
                <span className="text-xs text-muted-foreground">Group before pass</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-blue-500" />
                  <span className="text-xs text-foreground">Carrier</span>
                </div>
                <span className="text-xs text-muted-foreground">Group before pass</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tow Pass Dialog */}
      <Dialog open={towPassDialog.open} onOpenChange={(open) => setTowPassDialog({ open })}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Tow Pass Generated</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted dark:bg-black rounded-lg font-mono text-sm whitespace-pre-wrap text-red-600 dark:text-red-400 border border-border">
              {towPassDialog.towPass}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigator.clipboard.writeText(towPassDialog.towPass || '')}
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-muted"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => setTowPassDialog({ open: false })}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
