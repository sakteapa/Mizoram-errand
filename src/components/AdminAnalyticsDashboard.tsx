import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Percent,
  Layers,
  Footprints
} from 'lucide-react';
import { 
  DAILY_REVENUE_TRENDS, 
  MONTHLY_REVENUE_TRENDS, 
  MIZORAM_DISTRICT_ANALYTICS, 
  CATEGORY_REVENUE_BREAKDOWN 
} from '../utils/analyticsData.ts';
import { 
  calculateDistrictMetrics, 
  formatIndianCurrency 
} from '../utils/analyticsEngine.ts';
import type { DistrictMetric } from '../utils/analyticsEngine.ts';

interface AdminAnalyticsDashboardProps {
  language: 'en' | 'mizo';
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({ language }) => {
  const isMizo = language === 'mizo';

  // Filters & State
  const [timeHorizon, setTimeHorizon] = useState<'daily' | 'monthly'>('daily');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'tasks' | 'breakdown'>('revenue');

  // Computed summary
  const districtMetricsSummary = useMemo(() => {
    return calculateDistrictMetrics(MIZORAM_DISTRICT_ANALYTICS);
  }, []);

  // Filtered district list
  const filteredDistricts = useMemo(() => {
    if (selectedDistrictId === 'all') return MIZORAM_DISTRICT_ANALYTICS;
    return MIZORAM_DISTRICT_ANALYTICS.filter(d => d.districtId === selectedDistrictId);
  }, [selectedDistrictId]);

  // Selected district details if specific
  const activeDistrictData = useMemo(() => {
    if (selectedDistrictId === 'all') return null;
    return MIZORAM_DISTRICT_ANALYTICS.find(d => d.districtId === selectedDistrictId);
  }, [selectedDistrictId]);

  // Daily or Monthly data for revenue trend chart
  const trendData = useMemo(() => {
    if (timeHorizon === 'daily') {
      return DAILY_REVENUE_TRENDS.map(item => ({
        label: item.dayLabel,
        grossVolume: item.grossVolume,
        platformFee: item.platformFee,
        workerEarnings: item.workerEarnings,
        tasks: item.tasksCompleted,
        hillSurcharge: item.hillSurchargeSum,
        growth: 0,
      }));
    } else {
      return MONTHLY_REVENUE_TRENDS.map(item => ({
        label: isMizo ? item.monthMizo : item.month,
        grossVolume: item.grossVolume,
        platformFee: item.platformFee,
        workerEarnings: item.workerEarnings,
        tasks: item.completedTasks,
        hillSurcharge: Math.round(item.grossVolume * 0.12),
        growth: item.growthPercentage,
      }));
    }
  }, [timeHorizon, isMizo]);

  // Total summary for current view
  const currentTotalGross = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.grossVolume, 0);
  }, [trendData]);

  const currentPlatformFee = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.platformFee, 0);
  }, [trendData]);

  const currentTotalTasks = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.tasks, 0);
  }, [trendData]);

  // CSV Export
  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "District,Total Tasks,Completed Tasks,Completion Rate (%),Total Revenue (INR),Avg Turnaround (Mins)\n";
    MIZORAM_DISTRICT_ANALYTICS.forEach(d => {
      csvContent += `"${d.districtName}",${d.totalTasks},${d.completedTasks},${d.completionRate},${d.totalRevenue},${d.avgCompletionMinutes}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mizoram_platform_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip
  const CustomRevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1">
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {entry.dataKey === 'tasks' ? (
                  `${entry.value} jobs`
                ) : (
                  <>
                    <span className="currency-symbol">₹</span>
                    {formatIndianCurrency(entry.value)}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Controls: Time Horizon, District Filter, CSV Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Horizon Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTimeHorizon('daily')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                timeHorizon === 'daily'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isMizo ? 'Ni Tin (Last 14 Days)' : 'Daily Trend (14d)'}</span>
            </button>
            <button
              onClick={() => setTimeHorizon('monthly')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                timeHorizon === 'monthly'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isMizo ? 'Thla Tin (Monthly)' : 'Monthly Trend (12m)'}</span>
            </button>
          </div>

          {/* Metric Focus Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartMetric('revenue')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                chartMetric === 'revenue' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              {isMizo ? 'Sum Laklut (Revenue)' : 'Revenue'}
            </button>
            <button
              onClick={() => setChartMetric('tasks')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                chartMetric === 'tasks' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              {isMizo ? 'Hna Zat (Jobs)' : 'Jobs Completed'}
            </button>
            <button
              onClick={() => setChartMetric('breakdown')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                chartMetric === 'breakdown' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              {isMizo ? 'Hna Chi Hrang' : 'Category Share'}
            </button>
          </div>
        </div>

        {/* District Filter & Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filter by Mizoram District"
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">
                {isMizo ? 'Mizoram District Zawng Zawng' : 'All Mizoram Districts'}
              </option>
              {MIZORAM_DISTRICT_ANALYTICS.map(d => (
                <option key={d.districtId} value={d.districtId} className="bg-slate-900">
                  {d.districtName} ({d.completionRate}% completed)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 font-medium transition"
            title="Download CSV Summary"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{isMizo ? 'CSV La Chhuak' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Platform Volume */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{isMizo ? 'Gross Platform Volume' : 'Gross Platform Volume'}</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
            <span className="currency-symbol">₹</span>
            {formatIndianCurrency(currentTotalGross)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% {isMizo ? 'kar hmasa aia sang' : 'vs previous period'}</span>
          </div>
        </div>

        {/* Net Platform Revenue (15% Commission) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{isMizo ? 'Platform Sum Hlawk (15%)' : 'Net Platform Revenue (15%)'}</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono mt-1">
            <span className="currency-symbol">₹</span>
            {formatIndianCurrency(currentPlatformFee)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            {isMizo ? 'Thawktu hlawh: 85%' : 'Field Worker Share: 85%'}
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{isMizo ? 'Hna Zawh Felfai Rate' : 'Task Completion Rate'}</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
            {activeDistrictData ? activeDistrictData.completionRate : districtMetricsSummary.overallCompletionRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <span>Top: </span>
            <strong className="text-slate-200">
              {districtMetricsSummary.highestPerformingDistrict} (95.0%)
            </strong>
          </div>
        </div>

        {/* Total Tasks Handled */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{isMizo ? 'Hna Thawh Zawh Zat' : 'Total Jobs Completed'}</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono mt-1">
            {formatIndianCurrency(currentTotalTasks)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <Users className="w-3 h-3 text-emerald-400" />
            <span>186 {isMizo ? 'thawktu field ah an inpeih' : 'verified field agents'}</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section: Revenue & Task Trends */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>
                {timeHorizon === 'daily'
                  ? (isMizo ? 'Ni Tin Sum Laklut & Hna Dinhmun (Daily Revenue & Volume)' : 'Daily Platform Revenue & Job Volume Trend')
                  : (isMizo ? 'Thla Tin Sum Laklut (Monthly Revenue Trend 2026)' : 'Monthly Platform Revenue & Growth Trend (2026)')}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {timeHorizon === 'daily'
                ? 'Showing last 14 days with peak hill gradient surcharge and courier payouts'
                : 'Showing 12-month platform trajectory with seasonal harvest/festival spikes'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Gross Volume</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>Net Platform Fee (15%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Completed Jobs</span>
            </span>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={trendData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              />
              
              <YAxis 
                yAxisId="left"
                stroke="#64748b" 
                fontSize={11}
                tickFormatter={(val) => `₹${val > 9999 ? (val / 1000).toFixed(0) + 'k' : val}`}
                tickLine={false}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              />

              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#64748b" 
                fontSize={11}
                tickFormatter={(val) => `${val}`}
                tickLine={false}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              />

              <Tooltip content={<CustomRevenueTooltip />} />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="grossVolume"
                name="Gross Volume"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#grossGradient)"
              />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="platformFee"
                name="Platform Fee (15%)"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#netGradient)"
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tasks"
                name="Completed Jobs"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: District Completion Rates & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): District Completion Rates & Terrain Ranking */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>
                  {isMizo 
                    ? 'Mizoram District Hrang Hrang a Hna Zawh Felfai Rate' 
                    : 'Task Completion Rate Across Mizoram Districts'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isMizo 
                  ? 'Tlangram harsa leh kawng kual kar a thawktu te hna zawh dan' 
                  : 'Fulfillment efficiency correlated with hill terrain gradient'}
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Avg 91.8% State Rate
            </span>
          </div>

          {/* Bar Chart comparing districts */}
          <div className="w-full h-56 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredDistricts}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="districtName" 
                  stroke="#94a3b8" 
                  fontSize={11}
                  tickLine={false} 
                />
                <YAxis 
                  domain={[70, 100]} 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickFormatter={(val) => `${val}%`} 
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [`${value}%`, 'Completion Rate']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="completionRate" 
                  name="Completion Rate %" 
                  radius={[6, 6, 0, 0]}
                >
                  {filteredDistricts.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.completionRate >= 92 ? '#10b981' : entry.completionRate >= 88 ? '#06b6d4' : '#f59e0b'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* District Table Breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                  <th className="pb-2 font-semibold">District</th>
                  <th className="pb-2 font-semibold">Completion</th>
                  <th className="pb-2 font-semibold">Total Revenue</th>
                  <th className="pb-2 font-semibold">Turnaround</th>
                  <th className="pb-2 font-semibold text-right">Terrain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredDistricts.map((d) => (
                  <tr key={d.districtId} className="hover:bg-slate-950/40 transition">
                    <td className="py-2.5 font-sans font-medium text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{
                        backgroundColor: d.completionRate >= 92 ? '#10b981' : d.completionRate >= 88 ? '#06b6d4' : '#f59e0b'
                      }} />
                      <span>{d.districtName}</span>
                    </td>
                    <td className="py-2.5 font-bold text-emerald-400">
                      {d.completionRate}%
                      <span className="text-[10px] text-slate-500 font-normal ml-1">
                        ({d.completedTasks}/{d.totalTasks})
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      <span className="currency-symbol">₹</span>
                      {formatIndianCurrency(d.totalRevenue)}
                    </td>
                    <td className="py-2.5 text-slate-400 font-sans">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>~{d.avgCompletionMinutes} mins</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-sans">
                      <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] text-amber-300 border border-slate-800">
                        {d.avgTerrainDifficulty}/5
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (5 cols): Revenue by Service Category (Pie / Donut) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400" />
              <span>
                {isMizo ? 'Service Hrang Hrang Sum Laklut (Share)' : 'Revenue Share by Service Module'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown across errands, skilled artisans, LPG gas, and pharmacy
            </p>
          </div>

          {/* Pie Chart */}
          <div className="w-full h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_REVENUE_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="revenue"
                >
                  {CATEGORY_REVENUE_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `₹${formatIndianCurrency(value)}`,
                    item.payload.categoryNameEn
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Legend list with values */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {CATEGORY_REVENUE_BREAKDOWN.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 font-medium">
                    {isMizo ? cat.categoryNameMizo : cat.categoryNameEn}
                  </span>
                </div>
                <div className="font-mono text-white font-bold flex items-center gap-2">
                  <span>
                    <span className="currency-symbol">₹</span>
                    {formatIndianCurrency(cat.revenue)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({cat.taskCount} jobs)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
