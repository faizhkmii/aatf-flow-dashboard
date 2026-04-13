export type VehicleStatus =
  | 'towing_arrangement'
  | 'on_the_way'
  | 'checked_in'
  | 'depollution_in_progress'
  | 'depollution_done'
  | 'transferred_to_bd'
  | 'dismantling_in_progress'
  | 'body_dismantling_done'
  | 'sent_to_yard'
  | 'excavator_dismantling'
  | 'vehicle_dismantled';

export type TowingType = 'trailer' | 'carrier' | 'towtruck';

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  status: VehicleStatus;
  facility: string;
  towingType: TowingType;
  timestamps: {
    towingArrangement?: Date;
    eta?: Date;
    checkedIn?: Date;
    depollutionStart?: Date;
    depollutionEnd?: Date;
    bodyDismantlingStart?: Date;
    bodyDismantlingEnd?: Date;
    forkliftPickupFromBD?: Date;
    sentToYard?: Date;
    excavatorStart?: Date;
    excavatorPhotoCapture?: Date;
  };
}

export interface FacilityCapacity {
  facilityName: string;
  currentCount: number;
  maxCapacity: number;
  byStatus: {
    status: VehicleStatus;
    count: number;
  }[];
}

const facilities = ['CM1', 'CM2', 'CM3'];
const vehicleTypes = ['Sedan', 'SUV', 'Truck', 'Van'];
const towingTypes: TowingType[] = ['trailer', 'carrier', 'towtruck'];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function generateMockVehicles(count: number, timeRange: 'today' | 'weekly' | 'monthly'): Vehicle[] {
  const vehicles: Vehicle[] = [];
  const now = new Date();

  let startDate: Date;
  if (timeRange === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (timeRange === 'weekly') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const statuses: VehicleStatus[] = [
    'towing_arrangement',
    'on_the_way',
    'checked_in',
    'depollution_in_progress',
    'depollution_done',
    'transferred_to_bd',
    'dismantling_in_progress',
    'body_dismantling_done',
    'sent_to_yard',
    'excavator_dismantling',
    'vehicle_dismantled'
  ];

  for (let i = 0; i < count; i++) {
    const facility = facilities[Math.floor(Math.random() * facilities.length)];
    const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const towingType = towingTypes[Math.floor(Math.random() * towingTypes.length)];

    const baseTime = randomDate(startDate, now);
    const timestamps: Vehicle['timestamps'] = {};

    // Generate realistic timestamps based on status
    if (status !== 'towing_arrangement') {
      timestamps.towingArrangement = baseTime;
    }

    if (['on_the_way', 'checked_in'].includes(status) || statuses.indexOf(status) > statuses.indexOf('on_the_way')) {
      timestamps.eta = addMinutes(baseTime, Math.random() * 120 + 30);
    }

    if (status !== 'on_the_way' && status !== 'towing_arrangement' && statuses.indexOf(status) > statuses.indexOf('checked_in')) {
      timestamps.checkedIn = addMinutes(baseTime, Math.random() * 60 + 10);
    }

    if (status === 'depollution_in_progress' || statuses.indexOf(status) > statuses.indexOf('depollution_in_progress')) {
      timestamps.depollutionStart = addMinutes(timestamps.checkedIn || baseTime, Math.random() * 30 + 10);
    }

    if (status !== 'depollution_in_progress' && statuses.indexOf(status) > statuses.indexOf('depollution_in_progress')) {
      timestamps.depollutionEnd = addMinutes(timestamps.depollutionStart || baseTime, Math.random() * 45 + 15);
    }

    if (status === 'dismantling_in_progress' || statuses.indexOf(status) > statuses.indexOf('dismantling_in_progress')) {
      timestamps.bodyDismantlingStart = addMinutes(timestamps.depollutionEnd || baseTime, Math.random() * 40 + 5);
    }

    if (status !== 'dismantling_in_progress' && statuses.indexOf(status) > statuses.indexOf('dismantling_in_progress')) {
      timestamps.bodyDismantlingEnd = addMinutes(timestamps.bodyDismantlingStart || baseTime, Math.random() * 90 + 30);
      timestamps.forkliftPickupFromBD = addMinutes(timestamps.bodyDismantlingEnd, Math.random() * 30 + 5);
    }

    if (status === 'sent_to_yard' || statuses.indexOf(status) > statuses.indexOf('sent_to_yard')) {
      timestamps.sentToYard = timestamps.forkliftPickupFromBD || addMinutes(baseTime, 200);
    }

    if (status === 'excavator_dismantling' || status === 'vehicle_dismantled') {
      timestamps.excavatorStart = addMinutes(timestamps.sentToYard || baseTime, Math.random() * 60 + 10);
    }

    if (status === 'vehicle_dismantled') {
      timestamps.excavatorPhotoCapture = addMinutes(timestamps.excavatorStart || baseTime, Math.random() * 120 + 30);
    }

    vehicles.push({
      id: `VEH-${String(i + 1).padStart(4, '0')}`,
      vehicleNumber: `${['ABC', 'XYZ', 'DEF', 'GHI'][Math.floor(Math.random() * 4)]}-${Math.floor(Math.random() * 9000 + 1000)}`,
      vehicleType,
      status,
      facility,
      towingType,
      timestamps
    });
  }

  return vehicles;
}

export function calculateFacilityCapacity(vehicles: Vehicle[]): FacilityCapacity[] {
  const capacityMap = new Map<string, FacilityCapacity>();

  facilities.forEach(facility => {
    capacityMap.set(facility, {
      facilityName: facility,
      currentCount: 0,
      maxCapacity: 150,
      byStatus: []
    });
  });

  vehicles.forEach(vehicle => {
    const capacity = capacityMap.get(vehicle.facility);
    if (!capacity) return;

    // Only count vehicles that are physically in the facility (not on the way or fully dismantled)
    if (vehicle.status !== 'towing_arrangement' &&
        vehicle.status !== 'on_the_way' &&
        vehicle.status !== 'vehicle_dismantled') {
      capacity.currentCount++;
    }

    // Track all vehicles by status for detailed breakdowns
    const existing = capacity.byStatus.find(s => s.status === vehicle.status);
    if (existing) {
      existing.count++;
    } else {
      capacity.byStatus.push({ status: vehicle.status, count: 1 });
    }
  });

  return Array.from(capacityMap.values());
}

export function calculateMetrics(vehicle: Vehicle) {
  const { timestamps } = vehicle;

  // Depollution Duration
  const depollutionDuration = timestamps.depollutionStart && timestamps.depollutionEnd
    ? (timestamps.depollutionEnd.getTime() - timestamps.depollutionStart.getTime()) / 60000
    : null;

  // Transfer Time: Depollution to Body Dismantling
  const transferTimeDepollutionToBD = timestamps.depollutionEnd && timestamps.bodyDismantlingStart
    ? (timestamps.bodyDismantlingStart.getTime() - timestamps.depollutionEnd.getTime()) / 60000
    : null;

  // Body Dismantling Duration
  const bodyDismantlingDuration = timestamps.bodyDismantlingStart && timestamps.bodyDismantlingEnd
    ? (timestamps.bodyDismantlingEnd.getTime() - timestamps.bodyDismantlingStart.getTime()) / 60000
    : null;

  // Transfer Time: Body Dismantling to Yard
  const transferTimeBDToYard = timestamps.bodyDismantlingEnd && timestamps.forkliftPickupFromBD
    ? (timestamps.forkliftPickupFromBD.getTime() - timestamps.bodyDismantlingEnd.getTime()) / 60000
    : null;

  // Excavator Dismantling Duration
  const excavatorDuration = timestamps.excavatorStart && timestamps.excavatorPhotoCapture
    ? (timestamps.excavatorPhotoCapture.getTime() - timestamps.excavatorStart.getTime()) / 60000
    : null;

  return {
    depollutionDuration,
    transferTimeDepollutionToBD,
    bodyDismantlingDuration,
    transferTimeBDToYard,
    excavatorDuration
  };
}

export function getStatusLabel(status: VehicleStatus): string {
  const labels: Record<VehicleStatus, string> = {
    'towing_arrangement': 'Towing Arrangement',
    'on_the_way': 'On The Way',
    'checked_in': 'Checked In',
    'depollution_in_progress': 'Depollution In Progress',
    'depollution_done': 'Depollution Done',
    'transferred_to_bd': 'Transferred to BD',
    'dismantling_in_progress': 'Dismantling In Progress',
    'body_dismantling_done': 'Body Dismantling Done',
    'sent_to_yard': 'Sent to Yard',
    'excavator_dismantling': 'Excavator Dismantling',
    'vehicle_dismantled': 'Vehicle Dismantled'
  };
  return labels[status];
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return 'N/A';

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
