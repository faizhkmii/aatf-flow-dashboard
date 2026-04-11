import { Truck, Copy, X, Filter, FileText } from 'lucide-react';
import { Vehicle, FacilityCapacity, getStatusLabel } from '../utils/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

export function TowingArrangementDashboard({ vehicles, facilityCapacity }: TowingArrangementDashboardProps) {
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [towingTypeFilter, setTowingTypeFilter] = useState<string>('all');
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [towPassDialog, setTowPassDialog] = useState<{ open: boolean; towPass?: string }>({ open: false });

  const chartStyles = getChartStyles();

  const filteredVehicles = selectedFacility === 'all' ? vehicles : vehicles.filter(v => v.facility === selectedFacility);
  const towingArrangementVehicles = filteredVehicles.filter(v => v.status === 'towing_arrangement');
  const onTheWayVehicles = filteredVehicles.filter(v => v.status === 'on_the_way');

  const filteredByTowing = towingTypeFilter === 'all'
    ? towingArrangementVehicles
    : towingArrangementVehicles.filter(v => v.towingType === towingTypeFilter);

  // Counts by towing type (all vehicles, not just towing_arrangement)
  const allTowtruckCount = filteredVehicles.filter(v => v.towingType === 'towtruck').length;
  const allCarrierCount = filteredVehicles.filter(v => v.towingType === 'carrier').length;
  const allTrailerCount = filteredVehicles.filter(v => v.towingType === 'trailer').length;

  // Counts awaiting arrangement by towing type
  const towtruckAwaiting = towingArrangementVehicles.filter(v => v.towingType === 'towtruck').length;
  const carrierAwaiting = towingArrangementVehicles.filter(v => v.towingType === 'carrier').length;
  const trailerAwaiting = towingArrangementVehicles.filter(v => v.towingType === 'trailer').length;

  // Chart data: vehicles by towing type across facilities
  const facilityTowingData = (selectedFacility === 'all' ? facilityCapacity : facilityCapacity.filter(f => f.facilityName === selectedFacility)).map(f => {
    const fVehicles = vehicles.filter(v => v.facility === f.facilityName && v.status === 'towing_arrangement');
    return {
      facility: f.facilityName,
      towtruck: fVehicles.filter(v => v.towingType === 'towtruck').length,
      carrier: fVehicles.filter(v => v.towingType === 'carrier').length,
      trailer: fVehicles.filter(v => v.towingType === 'trailer').length,
    };
  });

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicles(prev =>
      prev.find(v => v.id === vehicle.id)
        ? prev.filter(v => v.id !== vehicle.id)
        : [...prev, vehicle]
    );
  };

  const generateTowPass = (vehicle: Vehicle) => {
    const towPass = `══════════════════════════════════
          TOW PASS
══════════════════════════════════
Vehicle No:    ${vehicle.vehicleNumber}
Vehicle Type:  ${vehicle.vehicleType}
Facility:      ${vehicle.facility}
Towing Type:   ${vehicle.towingType.toUpperCase()}

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
${selectedVehicles.map((v, i) => `${i + 1}. ${v.vehicleNumber} (${v.vehicleType})`).join('\n')}

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
    selectedVehicles.every(v => v.towingType !== 'towtruck') &&
    selectedVehicles.every(v => v.towingType === selectedVehicles[0].towingType) &&
    selectedVehicles.every(v => v.facility === selectedVehicles[0].facility);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-foreground">Facility:</span>
        </div>
        <Select value={selectedFacility} onValueChange={setSelectedFacility}>
          <SelectTrigger className="w-48 bg-muted border-border text-foreground">
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent className="bg-muted border-border">
            <SelectItem value="all">All Facilities</SelectItem>
            {facilityCapacity.map(f => (
              <SelectItem key={f.facilityName} value={f.facilityName}>
                {f.facilityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Awaiting Towing</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-500">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{towingArrangementVehicles.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Need towing arrangement</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Currently In Transit</span>
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{onTheWayVehicles.length}</div>
          <div className="text-xs text-muted-foreground mt-1">On the way to facilities</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Selected for Grouping</span>
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{selectedVehicles.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Ready to generate pass</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Vehicles</span>
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{filteredVehicles.length}</div>
          <div className="text-xs text-muted-foreground mt-1">All towing types</div>
        </div>
      </div>

      {/* Towing Type Breakdown & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Towing type filter cards */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-foreground mb-4">Towing Type Breakdown</h3>
          <div className="space-y-3">
            <button
              onClick={() => setTowingTypeFilter(towingTypeFilter === 'towtruck' ? 'all' : 'towtruck')}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                towingTypeFilter === 'towtruck' ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700' : 'bg-muted border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Towtruck</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Individual towing - generates pass immediately</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{towtruckAwaiting}</div>
                  <div className="text-xs text-muted-foreground">awaiting / {allTowtruckCount} total</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setTowingTypeFilter(towingTypeFilter === 'carrier' ? 'all' : 'carrier')}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                towingTypeFilter === 'carrier' ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700' : 'bg-muted border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Carrier</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Group vehicles before generating pass</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{carrierAwaiting}</div>
                  <div className="text-xs text-muted-foreground">awaiting / {allCarrierCount} total</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setTowingTypeFilter(towingTypeFilter === 'trailer' ? 'all' : 'trailer')}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                towingTypeFilter === 'trailer' ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700' : 'bg-muted border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Trailer</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Group vehicles before generating pass</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{trailerAwaiting}</div>
                  <div className="text-xs text-muted-foreground">awaiting / {allTrailerCount} total</div>
                </div>
              </div>
            </button>
            {towingTypeFilter !== 'all' && (
              <button
                onClick={() => setTowingTypeFilter('all')}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                Clear filter - Show all types
              </button>
            )}
          </div>
        </div>

        {/* Chart: awaiting by facility */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-foreground mb-4">Awaiting Towing by Facility</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={facilityTowingData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
              <XAxis dataKey="facility" stroke={chartStyles.axisColor} />
              <YAxis stroke={chartStyles.axisColor} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: chartStyles.tooltipBg, border: '1px solid ' + chartStyles.tooltipBorder, borderRadius: '8px', color: chartStyles.tooltipColor }}
              />
              <Legend />
              <Bar dataKey="towtruck" fill="#dc2626" name="Towtruck" />
              <Bar dataKey="carrier" fill="#3b82f6" name="Carrier" />
              <Bar dataKey="trailer" fill="#eab308" name="Trailer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Group action bar */}
      {selectedVehicles.length > 0 && (
        <div className="p-4 bg-card border border-red-200 dark:border-red-800/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground">
              <span className="font-medium">{selectedVehicles.length}</span> vehicle{selectedVehicles.length > 1 ? 's' : ''} selected
              {selectedVehicles.length === 1 && selectedVehicles[0].towingType !== 'towtruck' && (
                <span className="text-yellow-400 ml-2">- Select more {selectedVehicles[0].towingType} vehicles to the same facility to group</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedVehicles([])}
              className="border-border text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Selection
            </Button>
          </div>

          {/* Selected vehicles preview */}
          <div className="flex flex-wrap gap-2">
            {selectedVehicles.map(v => (
              <span key={v.id} className="px-2 py-1 bg-muted border border-border rounded text-xs text-foreground">
                {v.vehicleNumber} ({v.towingType}) - {v.facility}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            {canGroupVehicles && (
              <Button onClick={generateGroupedTowPass} className="bg-red-600 hover:bg-red-700 text-foreground">
                <Truck className="w-4 h-4 mr-2" />
                Generate Group Tow Pass ({selectedVehicles.length} vehicles)
              </Button>
            )}
            {selectedVehicles.length === 1 && selectedVehicles[0].towingType === 'towtruck' && (
              <Button onClick={() => generateTowPass(selectedVehicles[0])} className="bg-red-600 hover:bg-red-700 text-foreground">
                <FileText className="w-4 h-4 mr-2" />
                Generate Tow Pass for {selectedVehicles[0].vehicleNumber}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Vehicle list */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-foreground">Vehicles Requiring Towing Arrangement ({filteredByTowing.length})</h3>
          {towingTypeFilter !== 'all' && (
            <Badge variant="outline" className={`text-xs ${
              towingTypeFilter === 'towtruck' ? 'border-red-600 text-red-400' :
              towingTypeFilter === 'carrier' ? 'border-blue-600 text-blue-400' :
              'border-yellow-600 text-yellow-400'
            }`}>
              Filtered: {towingTypeFilter}
            </Badge>
          )}
        </div>
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {filteredByTowing.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground text-sm">
              No vehicles currently requiring towing arrangement
              {towingTypeFilter !== 'all' && ' for this towing type'}
            </div>
          ) : (
            filteredByTowing.map(vehicle => (
              <div key={vehicle.id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {vehicle.towingType !== 'towtruck' ? (
                      <input
                        type="checkbox"
                        checked={selectedVehicles.some(v => v.id === vehicle.id)}
                        onChange={() => handleVehicleSelect(vehicle)}
                        className="w-4 h-4 rounded border-border bg-muted text-red-600 focus:ring-red-500"
                      />
                    ) : (
                      <div className="w-4" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-foreground">{vehicle.vehicleNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {vehicle.vehicleType} - {vehicle.facility} - ID: {vehicle.id}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs ${
                      vehicle.towingType === 'towtruck' ? 'border-red-600 text-red-400' :
                      vehicle.towingType === 'carrier' ? 'border-blue-600 text-blue-400' :
                      'border-yellow-600 text-yellow-400'
                    }`}>
                      {vehicle.towingType}
                    </Badge>
                    {vehicle.towingType === 'towtruck' && (
                      <Button
                        size="sm"
                        onClick={() => generateTowPass(vehicle)}
                        className="bg-red-600 hover:bg-red-700 text-foreground text-xs"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Generate Pass
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
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
                className="flex-1 border-border text-foreground hover:text-foreground hover:bg-muted"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => setTowPassDialog({ open: false })}
                className="flex-1 bg-red-600 hover:bg-red-700 text-foreground"
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
