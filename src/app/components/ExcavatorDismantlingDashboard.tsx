import { useState, useEffect } from 'react';
import { Search, Filter, Play, Camera, Square, Trophy, User, Zap, Medal } from 'lucide-react';
import { Vehicle, FacilityCapacity, calculateMetrics, formatDuration } from '../utils/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { VehicleTopView } from './VehicleTopView';

interface ExcavatorDismantlingDashboardProps {
  vehicles: Vehicle[];
  facilityCapacity: FacilityCapacity[];
}

// Mock operator names for the leaderboard
const operatorNames = ['Ahmad R.', 'Razak M.', 'Hafiz K.', 'Ismail N.', 'Faizal A.', 'Zulkifli H.'];

export function ExcavatorDismantlingDashboard({ vehicles, facilityCapacity }: ExcavatorDismantlingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [now, setNow] = useState(new Date());
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  // Live clock tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredByFacility = selectedFacility === 'all' ? vehicles : vehicles.filter(v => v.facility === selectedFacility);

  const readyVehicles = filteredByFacility.filter(v => v.status === 'sent_to_yard');
  const inProgressVehicles = filteredByFacility.filter(v => v.status === 'excavator_dismantling');
  const completedVehicles = filteredByFacility.filter(v => v.status === 'vehicle_dismantled');

  // Auto-select first in-progress vehicle if none selected
  useEffect(() => {
    if (!activeVehicle && inProgressVehicles.length > 0) {
      setActiveVehicle(inProgressVehicles[0]);
    }
  }, [inProgressVehicles.length]);

  const filteredReady = readyVehicles.filter(
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

  const formatTimer = (startTime: Date | undefined): string => {
    if (!startTime) return '00:00:00';
    const diff = Math.max(0, now.getTime() - startTime.getTime());
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getTimerColor = (startTime: Date | undefined): string => {
    if (!startTime) return 'text-muted-foreground';
    const diffMinutes = (now.getTime() - startTime.getTime()) / 60000;
    if (diffMinutes > 120) return 'text-red-500';
    if (diffMinutes > 60) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const handleStartDismantling = (vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
    console.log(`Start dismantling: ${vehicle.vehicleNumber}`);
  };

  const handleEndDismantling = () => {
    console.log(`End dismantling: ${activeVehicle?.vehicleNumber}`);
    setActiveVehicle(null);
  };

  const handleTakePhoto = () => {
    setPhotoDialogOpen(true);
    console.log(`Take photo: ${activeVehicle?.vehicleNumber}`);
  };

  // Generate mock leaderboard from completed vehicles
  const leaderboard = operatorNames.map((name, i) => {
    const vehiclesCompleted = Math.max(1, Math.floor(completedVehicles.length / operatorNames.length) + (i < 3 ? (3 - i) : 0));
    const avgTime = Math.max(15, avgExcavatorTime - (3 - i) * 8 + Math.random() * 10);
    return {
      name,
      vehiclesCompleted,
      avgTime,
      rank: i + 1,
    };
  }).sort((a, b) => a.avgTime - b.avgTime).map((op, i) => ({ ...op, rank: i + 1 }));

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

      {/* Main Layout: Left = Queue, Right = Active + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Vehicle Queue */}
        <div className="lg:col-span-3 space-y-4">
          {/* Queue Header */}
          <div className="bg-red-600 rounded-t-lg px-4 py-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Vehicles Ready to Dismantle ({readyVehicles.length})
            </h3>
          </div>

          {/* Search & Filter */}
          <div className="relative -mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search plate number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Vehicle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredReady.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-muted-foreground text-sm bg-card rounded-lg border border-border">
                No vehicles ready for dismantling
              </div>
            ) : (
              filteredReady.map(vehicle => {
                const waitTime = vehicle.timestamps.sentToYard
                  ? (now.getTime() - vehicle.timestamps.sentToYard.getTime()) / 60000
                  : null;

                return (
                  <div
                    key={vehicle.id}
                    className="bg-card rounded-lg border border-border p-3 hover:border-red-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-bold text-foreground">{vehicle.vehicleNumber}</div>
                        <div className="text-xs text-muted-foreground">{vehicle.vehicleType} - {vehicle.facility}</div>
                      </div>
                      <VehicleTopView vehicleType={vehicle.vehicleType} className="w-8 h-16 opacity-60" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Wait: {formatDuration(waitTime)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleStartDismantling(vehicle)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-3"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        START
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Active Dismantling + Stats + Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          {/* Currently Dismantling Panel */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="bg-foreground text-background px-4 py-2.5">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                CURRENTLY DISMANTLING
              </h3>
            </div>

            {activeVehicle ? (
              <div className="p-4 space-y-4">
                {/* Vehicle info row */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-muted/50 rounded-lg p-2">
                    <VehicleTopView vehicleType={activeVehicle.vehicleType} className="w-14 h-28" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-bold text-foreground">{activeVehicle.vehicleNumber}</div>
                    <div className="text-sm text-muted-foreground">{activeVehicle.vehicleType} - {activeVehicle.facility}</div>
                    <div className="text-xs text-muted-foreground mt-1">ID: {activeVehicle.id}</div>

                    {/* Timer details */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Time Start</span>
                        <span className="font-mono text-foreground">
                          {activeVehicle.timestamps.excavatorStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '--:--:--'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Duration</span>
                        <span className={`font-mono font-bold text-sm ${getTimerColor(activeVehicle.timestamps.excavatorStart)}`}>
                          {formatTimer(activeVehicle.timestamps.excavatorStart)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleTakePhoto}
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    onClick={handleEndDismantling}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">No active dismantling session</div>
                <div className="text-xs text-muted-foreground mt-1">Select a vehicle from the queue to start</div>
              </div>
            )}
          </div>

          {/* Today's Session Stats */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-red-500" />
              Today's Session
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-foreground">{completedVehicles.length}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Completed</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-foreground">{formatDuration(avgExcavatorTime)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Avg Time</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-foreground">{inProgressVehicles.length}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">In Progress</div>
              </div>
            </div>

            {/* Recent completions */}
            {completedVehicles.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1.5">Recent completions</div>
                {completedVehicles.slice(0, 3).map(v => {
                  const metrics = calculateMetrics(v);
                  return (
                    <div key={v.id} className="flex items-center justify-between py-1 text-xs">
                      <span className="text-foreground">{v.vehicleNumber}</span>
                      <span className="font-mono text-muted-foreground">{formatDuration(metrics.excavatorDuration)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Performance Leaderboard */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h4 className="font-medium text-foreground text-sm">Operator Leaderboard</h4>
            </div>
            <div className="divide-y divide-border">
              {leaderboard.map((op) => (
                <div
                  key={op.name}
                  className={`px-4 py-3 flex items-center gap-3 ${
                    op.rank <= 3 ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    op.rank === 1
                      ? 'bg-amber-400 text-amber-900'
                      : op.rank === 2
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                      : op.rank === 3
                      ? 'bg-amber-700 text-amber-100'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {op.rank <= 3 ? (
                      <Medal className="w-3.5 h-3.5" />
                    ) : (
                      op.rank
                    )}
                  </div>

                  {/* Name & stats */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{op.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {op.vehiclesCompleted} vehicles today
                    </div>
                  </div>

                  {/* Avg time */}
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-mono font-bold ${
                      op.rank === 1 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                    }`}>
                      {formatDuration(op.avgTime)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">avg/vehicle</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Capture Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center">
                <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Camera preview</div>
                <div className="text-xs text-muted-foreground">Tap to capture</div>
              </div>
            </div>
            {activeVehicle && (
              <div className="text-center text-xs text-muted-foreground">
                Vehicle: {activeVehicle.vehicleNumber} - {activeVehicle.vehicleType}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setPhotoDialogOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setPhotoDialogOpen(false)}>
                <Camera className="w-4 h-4 mr-1" />
                Capture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
