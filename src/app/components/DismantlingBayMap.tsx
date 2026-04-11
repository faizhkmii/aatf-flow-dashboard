import { useState, useEffect } from 'react';
import { Square, StopCircle } from 'lucide-react';
import { Vehicle, formatDuration } from '../utils/mockData';
import { VehicleTopView } from './VehicleTopView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';

interface Bay {
  id: number;
  label: string;
  vehicle: Vehicle | null;
}

interface DismantlingBayMapProps {
  vehicles: Vehicle[];
  selectedFacility: string;
  onStopTimer: (vehicleId: string) => void;
}

export function DismantlingBayMap({ vehicles, selectedFacility, onStopTimer }: DismantlingBayMapProps) {
  const [now, setNow] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmStop, setConfirmStop] = useState<Vehicle | null>(null);

  // Tick every second for live timers
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Build facility sections: one per facility when "all", or just the selected one
  const facilityNames = selectedFacility === 'all'
    ? [...new Set(vehicles.map(v => v.facility))].sort()
    : [selectedFacility];

  const facilitySections = facilityNames.map(facility => {
    const facilityVehicles = vehicles
      .filter(v => v.facility === facility && v.status === 'dismantling_in_progress')
      .slice(0, 8);

    const bays: Bay[] = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      label: `Bay ${i + 1}`,
      vehicle: facilityVehicles[i] || null,
    }));

    return { facility, bays };
  });

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

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailOpen(true);
  };

  const handleStopRequest = (vehicle: Vehicle) => {
    setConfirmStop(vehicle);
  };

  const handleConfirmStop = () => {
    if (confirmStop) {
      onStopTimer(confirmStop.id);
      setConfirmStop(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bay Maps - one per facility */}
      {facilitySections.map(({ facility, bays }) => {
        const occupied = bays.filter(b => b.vehicle).length;
        return (
          <div key={facility} className="bg-muted/50 dark:bg-muted/30 rounded-xl border border-border overflow-hidden">
            {/* Facility header - shown when viewing all facilities */}
            {selectedFacility === 'all' && (
              <div className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between bg-card">
                <h4 className="text-foreground font-medium">{facility}</h4>
                <span className="text-xs text-muted-foreground">{occupied} / 8 bays occupied</span>
              </div>
            )}

            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {bays.map((bay) => (
                  <BaySlot
                    key={`${facility}-${bay.id}`}
                    bay={bay}
                    timer={formatTimer(bay.vehicle?.timestamps.bodyDismantlingStart)}
                    timerColor={getTimerColor(bay.vehicle?.timestamps.bodyDismantlingStart)}
                    onVehicleClick={handleVehicleClick}
                    onStopTimer={handleStopRequest}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 px-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>{"< 1h"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>1h - 2h</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>{"> 2h"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded border-2 border-dashed border-muted-foreground/40" />
          <span>Empty Bay</span>
        </div>
      </div>

      {/* Vehicle Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Vehicle Details</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4">
              {/* Vehicle visual */}
              <div className="flex justify-center py-4 bg-muted/50 rounded-lg">
                <VehicleTopView vehicleType={selectedVehicle.vehicleType} className="w-16 h-32" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Vehicle Number" value={selectedVehicle.vehicleNumber} />
                <InfoCard label="Vehicle Type" value={selectedVehicle.vehicleType} />
                <InfoCard label="Vehicle ID" value={selectedVehicle.id} />
                <InfoCard label="Facility" value={selectedVehicle.facility} />
                <InfoCard label="Towing Type" value={selectedVehicle.towingType} />
                <InfoCard
                  label="Time in Dismantling"
                  value={formatTimer(selectedVehicle.timestamps.bodyDismantlingStart)}
                  valueColor={getTimerColor(selectedVehicle.timestamps.bodyDismantlingStart)}
                  mono
                />
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Timeline</h4>
                <div className="space-y-1">
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
                </div>
              </div>

              {/* Stop button */}
              <button
                onClick={() => {
                  setDetailOpen(false);
                  handleStopRequest(selectedVehicle);
                }}
                className="w-full px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                Stop Dismantling
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stop Confirmation Dialog */}
      <Dialog open={confirmStop !== null} onOpenChange={(open) => !open && setConfirmStop(null)}>
        <DialogContent className="max-w-sm bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Stop Dismantling?</DialogTitle>
          </DialogHeader>
          {confirmStop && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <VehicleTopView vehicleType={confirmStop.vehicleType} className="w-10 h-20 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-foreground">{confirmStop.vehicleNumber}</div>
                  <div className="text-xs text-muted-foreground">{confirmStop.vehicleType} - {confirmStop.facility}</div>
                  <div className={`text-sm font-mono font-bold mt-1 ${getTimerColor(confirmStop.timestamps.bodyDismantlingStart)}`}>
                    {formatTimer(confirmStop.timestamps.bodyDismantlingStart)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will end the dismantling session and mark the vehicle as completed. This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmStop(null)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStop}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Stop & Complete
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Individual Bay Slot
function BaySlot({
  bay,
  timer,
  timerColor,
  onVehicleClick,
  onStopTimer,
}: {
  bay: Bay;
  timer: string;
  timerColor: string;
  onVehicleClick: (v: Vehicle) => void;
  onStopTimer: (v: Vehicle) => void;
}) {
  const occupied = bay.vehicle !== null;

  return (
    <div
      className={`relative rounded-lg border-2 transition-all ${
        occupied
          ? 'border-border bg-card shadow-sm hover:shadow-md cursor-pointer'
          : 'border-dashed border-muted-foreground/30 bg-card/50'
      }`}
      onClick={() => occupied && onVehicleClick(bay.vehicle!)}
    >
      {/* Bay label */}
      <div className="absolute top-1.5 left-2 text-[10px] font-medium text-muted-foreground z-10">
        {bay.label}
      </div>

      {occupied ? (
        <div className="pt-7 pb-3 px-3 flex flex-col items-center">
          {/* Vehicle SVG */}
          <div className="w-full flex justify-center py-2">
            <VehicleTopView
              vehicleType={bay.vehicle!.vehicleType}
              className="w-16 h-32 drop-shadow-sm"
            />
          </div>

          {/* Vehicle number */}
          <div className="text-xs font-medium text-foreground mt-2 truncate w-full text-center">
            {bay.vehicle!.vehicleNumber}
          </div>

          {/* Timer + Stop button row */}
          <div className="flex items-center gap-2 mt-2 w-full justify-center">
            <span className={`font-mono text-sm font-bold ${timerColor} bg-muted px-2 py-1 rounded`}>
              {timer}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStopTimer(bay.vehicle!);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-foreground text-background text-xs font-bold rounded hover:opacity-80 transition-opacity"
            >
              <StopCircle className="w-3.5 h-3.5" />
              STOP
            </button>
          </div>
        </div>
      ) : (
        <div className="py-14 flex flex-col items-center justify-center">
          <Square className="w-10 h-10 text-muted-foreground/20" />
          <span className="text-xs text-muted-foreground/40 mt-2">Empty</span>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, valueColor, mono }: { label: string; value: string; valueColor?: string; mono?: boolean }) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium ${valueColor || 'text-foreground'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
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
