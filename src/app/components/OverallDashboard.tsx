import { AlertTriangle, Activity, Clock, TrendingDown } from 'lucide-react';
import { Vehicle, calculateMetrics, getStatusLabel, formatDuration, FacilityCapacity } from '../utils/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getChartStyles } from '../utils/chartStyles';

interface OverallDashboardProps {
  vehicles: Vehicle[];
  facilityCapacity: FacilityCapacity[];
}

export function OverallDashboard({ vehicles, facilityCapacity }: OverallDashboardProps) {
  const chartStyles = getChartStyles();

  const statusCounts = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: getStatusLabel(status as any),
    value: count
  }));

  const bottlenecks = analyzeBottlenecks(vehicles);

  const phaseData = [
    { name: 'On The Way', count: statusCounts['on_the_way'] || 0 },
    { name: 'Checked In', count: statusCounts['checked_in'] || 0 },
    { name: 'Depollution', count: (statusCounts['depollution_in_progress'] || 0) + (statusCounts['depollution_done'] || 0) },
    { name: 'Body Dismantling', count: (statusCounts['dismantling_in_progress'] || 0) + (statusCounts['body_dismantling_done'] || 0) },
    { name: 'Yard', count: statusCounts['sent_to_yard'] || 0 },
    { name: 'Excavator', count: (statusCounts['excavator_dismantling'] || 0) + (statusCounts['vehicle_dismantled'] || 0) }
  ];

  const totalInSystem = vehicles.filter(
    v => v.status !== 'towing_arrangement' && v.status !== 'vehicle_dismantled'
  ).length;

  const facilitiesAtRisk = facilityCapacity.filter(
    f => (f.currentCount / f.maxCapacity) * 100 >= 80
  );

  const COLORS = ['#dc2626', '#ef4444', '#f87171', '#b91c1c', '#991b1b', '#7f1d1d'];

  return (
    <div className="space-y-6">
      {(bottlenecks.criticalBottlenecks.length > 0 || facilitiesAtRisk.length > 0) && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-600 dark:text-red-400 font-medium">Critical Alerts</h3>
              {facilitiesAtRisk.length > 0 && (
                <p className="text-sm text-red-700 dark:text-red-300/80 mt-1">
                  {facilitiesAtRisk.length} {facilitiesAtRisk.length === 1 ? 'facility has' : 'facilities have'} exceeded 80% capacity
                </p>
              )}
              {bottlenecks.criticalBottlenecks.length > 0 && (
                <p className="text-sm text-red-700 dark:text-red-300/80 mt-1">
                  {bottlenecks.criticalBottlenecks.length} critical bottlenecks detected with excessive transfer times
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total in System</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-500">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalInSystem}</div>
          <div className="text-xs text-muted-foreground mt-1">Active vehicles</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Avg Transfer Time</span>
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{formatDuration(bottlenecks.avgTransferTime)}</div>
          <div className="text-xs text-muted-foreground mt-1">Between phases</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Bottlenecks Detected</span>
            <div className={`p-2 rounded-lg ${bottlenecks.criticalBottlenecks.length > 0 ? 'bg-red-50 dark:bg-red-950 text-red-500' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-500'}`}>
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{bottlenecks.criticalBottlenecks.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Critical delays</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Completed Today</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-500">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{statusCounts['vehicle_dismantled'] || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Fully processed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-foreground mb-4">Vehicles by Phase</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={phaseData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
              <XAxis dataKey="name" stroke={chartStyles.axisColor} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke={chartStyles.axisColor} />
              <Tooltip
                contentStyle={{ backgroundColor: chartStyles.tooltipBg, border: '1px solid ' + chartStyles.tooltipBorder, borderRadius: '8px', color: chartStyles.tooltipColor }}
              />
              <Bar dataKey="count" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-foreground mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                style={{ fill: 'var(--foreground)' }}
              >
                {statusChartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: chartStyles.tooltipBg, border: '1px solid ' + chartStyles.tooltipBorder, borderRadius: '8px', color: chartStyles.tooltipColor }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-foreground">
            Bottleneck Analysis
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Avg Wait: Depollution → Body Dismantling</div>
              <div className="text-foreground font-bold">{formatDuration(bottlenecks.avgDepollutionToBD)}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Avg Wait: Body Dismantling → Yard</div>
              <div className="text-foreground font-bold">{formatDuration(bottlenecks.avgBDToYard)}</div>
            </div>
          </div>

          {bottlenecks.criticalBottlenecks.length > 0 ? (
            <div>
              <h4 className="text-sm text-muted-foreground mb-2">Critical Delays ({">"} 60 min wait time)</h4>
              <div className="space-y-2">
                {bottlenecks.criticalBottlenecks.slice(0, 5).map((bottleneck, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800/30">
                    <div>
                      <div className="text-sm text-foreground">{bottleneck.vehicleNumber}</div>
                      <div className="text-xs text-muted-foreground">{bottleneck.phase}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-red-600 dark:text-red-400 font-medium">{formatDuration(bottleneck.waitTime)}</div>
                      <div className="text-xs text-muted-foreground">wait time</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No critical bottlenecks detected. System flow is optimal.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Bottleneck {
  vehicleNumber: string;
  phase: string;
  waitTime: number;
}

function analyzeBottlenecks(vehicles: Vehicle[]) {
  const criticalBottlenecks: Bottleneck[] = [];
  let totalTransferTime = 0;
  let transferCount = 0;
  let totalDepollutionToBD = 0;
  let depollutionToBDCount = 0;
  let totalBDToYard = 0;
  let bdToYardCount = 0;

  vehicles.forEach(vehicle => {
    const metrics = calculateMetrics(vehicle);

    if (metrics.transferTimeDepollutionToBD !== null) {
      totalDepollutionToBD += metrics.transferTimeDepollutionToBD;
      depollutionToBDCount++;
      totalTransferTime += metrics.transferTimeDepollutionToBD;
      transferCount++;

      if (metrics.transferTimeDepollutionToBD > 60) {
        criticalBottlenecks.push({
          vehicleNumber: vehicle.vehicleNumber,
          phase: 'Depollution → Body Dismantling',
          waitTime: metrics.transferTimeDepollutionToBD
        });
      }
    }

    if (metrics.transferTimeBDToYard !== null) {
      totalBDToYard += metrics.transferTimeBDToYard;
      bdToYardCount++;
      totalTransferTime += metrics.transferTimeBDToYard;
      transferCount++;

      if (metrics.transferTimeBDToYard > 60) {
        criticalBottlenecks.push({
          vehicleNumber: vehicle.vehicleNumber,
          phase: 'Body Dismantling → Yard',
          waitTime: metrics.transferTimeBDToYard
        });
      }
    }
  });

  criticalBottlenecks.sort((a, b) => b.waitTime - a.waitTime);

  return {
    criticalBottlenecks,
    avgTransferTime: transferCount > 0 ? totalTransferTime / transferCount : 0,
    avgDepollutionToBD: depollutionToBDCount > 0 ? totalDepollutionToBD / depollutionToBDCount : 0,
    avgBDToYard: bdToYardCount > 0 ? totalBDToYard / bdToYardCount : 0
  };
}
