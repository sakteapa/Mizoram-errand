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
  PieChart,
  Pie,
  Cell,
  BarChart
} from 'recharts';
import { 
  TrendingUp, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Layers, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  Filter, 
  Download, 
  Sparkles,
  BarChart3,
  Search,
  LayoutGrid,
  ChevronRight
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
import { Rupee } from './CurrencySymbol.tsx';

interface AdminAnalyticsDashboardProps {
  language: 'en' | 'mizo';
}

type DashboardSection = 'revenue' | 'districts' | 'categories' | 'all';

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({ language }) => {
  const isMizo = language === 'mizo';

  // Sub-view selection to avoid vertical scroll fatigue
  const [activeSection, setActiveSection] = useState<DashboardSection>('revenue');
  const [timeHorizon, setTimeHorizon] = useState<'daily' | 'monthly'>('daily');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('aizawl');
  const [districtSearch, setDistrictSearch] = useState<string>('');

  // Computed summary across all 11 Mizoram districts
  const districtMetricsSummary = useMemo(() => {
    return calculateDistrictMetrics(MIZORAM_DISTRICT_ANALYTICS);
  }, []);

  // Filtered district list based on search
  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return MIZORAM_DISTRICT_ANALYTICS;
    const q = districtSearch.toLowerCase();
    return MIZORAM_DISTRICT_ANALYTICS.filter(
      d => d.districtName.toLowerCase().includes(q) || d.districtNameMizo.toLowerCase().includes(q)
    );
  }, [districtSearch]);

  // Selected district details
  const activeDistrictData = useMemo(() => {
    return MIZORAM_DISTRICT_ANALYTICS.find(d => d.districtId === selectedDistrictId) 
      || MIZORAM_DISTRICT_ANALYTICS[0];
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
      }));
    } else {
      return MONTHLY_REVENUE_TRENDS.map(item => ({
        label: isMizo ? item.monthMizo.split(' ')[0] : item.month,
        fullLabel: isMizo ? item.monthMizo : `${item.month} 2026`,
        grossVolume: item.grossVolume,
        platformFee: item.platformFee,
        workerEarnings: item.workerEarnings,
        tasks: item.completedTasks,
        hillSurcharge: Math.round(item.grossVolume * 0.12),
        growth: item.growthPercentage,
      }));
    }
  }, [timeHorizon, isMizo]);

  // Summary figures
  const currentTotalGross = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.grossVolume, 0);
  }, [trendData]);

  const currentPlatformFee = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.platformFee, 0);
  }, [trendData]);

  const currentTotalTasks = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.tasks, 0);
  }, [trendData]);

  // CSV Export for administrative reporting
  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "District,Total Tasks,Completed Tasks,Completion Rate (%),Total Revenue (INR),Avg Turnaround (Mins),Couriers,Terrain Difficulty\n";
    MIZORAM_DISTRICT_ANALYTICS.forEach(d => {
      csvContent += `"${d.districtName}",${d.totalTasks},${d.completedTasks},${d.completionRate},${d.totalRevenue},${d.avgCompletionMinutes},${d.activeCouriers},${d.avgTerrainDifficulty}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mizoram_districts_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip for Crisp White Light Theme
  const CustomRevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs space-y-1 z-50">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs flex items-center">
                {entry.dataKey === 'tasks' ? (
                  `${entry.value} jobs`
                ) : (
                  <>
                    <Rupee className="w-3 h-3 text-slate-800" />
                    <span>{formatIndianCurrency(entry.value)}</span>
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
    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
      {/* Sleek Sub-View Switcher to eliminate long vertical scrolling */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSection('revenue')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              activeSection === 'revenue'
                ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isMizo ? 'Sum & Hna' : 'Revenue Trends'}</span>
          </button>

          <button
            onClick={() => setActiveSection('districts')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              activeSection === 'districts'
                ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-600" />
            <span>{isMizo ? 'Districts (Bial 11)' : 'District Rates'}</span>
          </button>

          <button
            onClick={() => setActiveSection('categories')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              activeSection === 'categories'
                ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 text-purple-600" />
            <span>{isMizo ? 'Rawngbawlna' : 'Categories'}</span>
          </button>

          <button
            onClick={() => setActiveSection('all')}
            className={`hidden md:flex px-3 py-1.5 rounded-lg font-bold items-center justify-center gap-1.5 transition ${
              activeSection === 'all'
                ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
            <span>{isMizo ? 'A Zavaiin' : 'All Overview'}</span>
          </button>
        </div>

        {/* Global CSV Download Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCsv}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 font-bold transition shadow-2xs"
            title="Download CSV report of all Mizoram districts"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isMizo ? 'Download CSV' : 'Export Data'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: REVENUE TRENDS (Daily & Monthly Recharts Composed Chart) */}
      {(activeSection === 'revenue' || activeSection === 'all') && (
        <div className="space-y-3">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Gross Volume */}
            <div className="bg-white border border-slate-200 p-3 sm:p-3.5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-[11px]">{isMizo ? 'Sum Lut Pum (Gross)' : 'Gross Volume'}</span>
                <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 font-mono flex items-center">
                <Rupee className="w-4 h-4 text-slate-900" />
                <span>{formatIndianCurrency(currentTotalGross)}</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>{timeHorizon === 'daily' ? '+14.2% daily growth' : '+15.8% avg monthly'}</span>
              </div>
            </div>

            {/* Platform Margin */}
            <div className="bg-white border border-slate-200 p-3 sm:p-3.5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-[11px]">{isMizo ? 'Platform Hlep (15%)' : 'Platform Net (15%)'}</span>
                <span className="p-1 rounded-md bg-cyan-50 text-cyan-700">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-cyan-700 font-mono flex items-center">
                <Rupee className="w-4 h-4 text-cyan-700" />
                <span>{formatIndianCurrency(currentPlatformFee)}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {isMizo ? 'Thawktu chan: 85%' : 'Couriers share: 85%'}
              </div>
            </div>

            {/* Total Completed Jobs */}
            <div className="bg-white border border-slate-200 p-3 sm:p-3.5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-[11px]">{isMizo ? 'Hna Zofel Zat' : 'Completed Tasks'}</span>
                <span className="p-1 rounded-md bg-purple-50 text-purple-700">
                  <Layers className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-purple-700 font-mono">
                {formatIndianCurrency(currentTotalTasks)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {isMizo ? '186 tlangram tirhkah' : '186 hill couriers active'}
              </div>
            </div>

            {/* Overall State Completion Rate */}
            <div className="bg-white border border-slate-200 p-3 sm:p-3.5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-[11px]">{isMizo ? 'Tlangpui Zofelna' : 'Mizoram Avg Rate'}</span>
                <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
                {districtMetricsSummary.overallCompletionRate}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Top: {districtMetricsSummary.highestPerformingDistrict} (95%)
              </div>
            </div>
          </div>

          {/* Revenue Chart Box */}
          <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {timeHorizon === 'daily'
                      ? (isMizo ? 'Ni Tin Sum Laklut (Daily Trends - 14 Days)' : 'Daily Revenue & Volume (14-Day Timeline)')
                      : (isMizo ? 'Thla Tin Sum Laklut (Monthly Trends - 2026)' : 'Monthly Revenue & Volume (2026 Timeline)')}
                  </span>
                </h3>
              </div>

              {/* Time Horizon Selector (Daily vs Monthly) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setTimeHorizon('daily')}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                    timeHorizon === 'daily'
                      ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span>{isMizo ? 'Ni Tin (14d)' : 'Daily (14d)'}</span>
                </button>
                <button
                  onClick={() => setTimeHorizon('monthly')}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                    timeHorizon === 'monthly'
                      ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span>{isMizo ? 'Thla Tin (12m)' : 'Monthly (12m)'}</span>
                </button>
              </div>
            </div>

            {/* Chart Legend Summary */}
            <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 pb-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span className="font-medium">Gross Volume</span>
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
                  <span className="font-medium">Platform Fee (15%)</span>
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-medium">Completed Jobs</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Hover or tap points for full breakdown
              </span>
            </div>

            {/* Recharts Composed Chart with Area and Line */}
            <div className="w-full h-56 sm:h-64 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="grossGradientLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="netGradientLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  
                  <XAxis 
                    dataKey="label" 
                    stroke="#64748b" 
                    fontSize={10}
                    tickLine={false}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  />
                  
                  <YAxis 
                    yAxisId="left"
                    stroke="#64748b" 
                    fontSize={10}
                    tickFormatter={(val) => `${val > 999 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    tickLine={false}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  />

                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#64748b" 
                    fontSize={10}
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
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#grossGradientLight)"
                  />

                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="platformFee"
                    name="Platform Fee (15%)"
                    stroke="#0891b2"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#netGradientLight)"
                  />

                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="tasks"
                    name="Completed Jobs"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#d97706' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: DISTRICT COMPLETION RATES (All 11 Mizoram Districts) */}
      {(activeSection === 'districts' || activeSection === 'all') && (
        <div className="space-y-3">
          {/* District Highlights Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">{isMizo ? 'District Zat' : 'Total Districts'}</span>
              <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">11 Bial</span>
            </div>
            <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">{isMizo ? 'Rate Sang Ber' : 'Top Completion'}</span>
              <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">Aizawl (95.0%)</span>
            </div>
            <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">{isMizo ? 'Average Turnaround' : 'Avg Turnaround'}</span>
              <span className="text-base font-bold text-cyan-700 font-mono mt-0.5 block">~43.5 Mins</span>
            </div>
            <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">{isMizo ? 'Hill Couriers' : 'Total Couriers'}</span>
              <span className="text-base font-bold text-purple-700 font-mono mt-0.5 block">210 Active</span>
            </div>
          </div>

          {/* Bar Chart Box */}
          <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{isMizo ? 'Mizoram District 11 Hna Zofelna Rate (%)' : 'Task Completion Rates Across All 11 Mizoram Districts'}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isMizo 
                    ? 'Tlangram kalkawng harsa zualte hisap telin completion rate en theih a ni.' 
                    : 'Benchmarking errand delivery and skilled service success by terrain.'}
                </p>
              </div>

              {/* Quick Search */}
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-xs w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={isMizo ? 'Zawnna (e.g. Aizawl, Lunglei)...' : 'Filter district...'}
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  className="bg-transparent text-slate-800 text-xs focus:outline-none w-full sm:w-36"
                />
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="w-full h-52 sm:h-56 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredDistricts}
                  margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="districtName" 
                    stroke="#64748b" 
                    fontSize={10}
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={[70, 100]} 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickFormatter={(val) => `${val}%`} 
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Completion Rate']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="completionRate" 
                    name="Completion Rate %" 
                    radius={[4, 4, 0, 0]}
                  >
                    {filteredDistricts.map((entry) => (
                      <Cell 
                        key={entry.districtId} 
                        fill={entry.completionRate >= 92 ? '#059669' : entry.completionRate >= 88 ? '#0891b2' : '#d97706'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive District Quick Selector & Compact Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left: District Detail Card (Updates on selection) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">{isMizo ? 'Bial Thlan Mek' : 'Selected District'}</span>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                    <span>{activeDistrictData.districtName}</span>
                    <span className="text-xs font-normal text-slate-500">({activeDistrictData.districtNameMizo})</span>
                  </h4>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  activeDistrictData.completionRate >= 92 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                }`}>
                  {activeDistrictData.completionRate}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Total Revenue</span>
                  <div className="font-mono font-bold text-slate-900 flex items-center mt-0.5">
                    <Rupee className="w-3 h-3 text-slate-900" />
                    <span>{formatIndianCurrency(activeDistrictData.totalRevenue)}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Tasks Completed</span>
                  <span className="font-mono font-bold text-purple-700 mt-0.5 block">
                    {activeDistrictData.completedTasks} / {activeDistrictData.totalTasks}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Turnaround</span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                    ~{activeDistrictData.avgCompletionMinutes} mins
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Terrain Difficulty</span>
                  <span className="font-mono font-bold text-amber-700 mt-0.5 block">
                    {activeDistrictData.avgTerrainDifficulty} / 5.0
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span>Active local dispatch couriers:</span>
                <span className="font-mono font-bold text-emerald-800">{activeDistrictData.activeCouriers} couriers</span>
              </div>
            </div>

            {/* Right: Compact District Selection List */}
            <div className="lg:col-span-7 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-xs font-bold text-slate-900">{isMizo ? 'Bial List (Hmet la en rawh)' : 'Select District for Details'}</span>
                <span className="text-[10px] text-slate-400 font-mono">11 Districts</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {filteredDistricts.map((d) => (
                  <button
                    key={d.districtId}
                    onClick={() => setSelectedDistrictId(d.districtId)}
                    className={`p-2 rounded-xl text-left border transition text-xs flex items-center justify-between ${
                      selectedDistrictId === d.districtId
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="block leading-tight">{d.districtName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{d.completionRate}%</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: SERVICE CATEGORY DISTRIBUTION */}
      {(activeSection === 'categories' || activeSection === 'all') && (
        <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-purple-600" />
                <span>{isMizo ? 'Rawngbawlna Hrang Hrang Sum Laklut (Service Share)' : 'Service Category Revenue & Demand Share'}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {isMizo 
                  ? 'Tirhkah, Electrician, Plumber, Gas Cylinder leh Two-Wheeler Taxi dinhmun.' 
                  : 'Breakdown across errands, skilled trades, LPG gas transit, and bike taxi.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Pie Chart */}
            <div className="md:col-span-5 h-48 sm:h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_REVENUE_BREAKDOWN}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={74}
                    paddingAngle={3}
                    dataKey="revenue"
                  >
                    {CATEGORY_REVENUE_BREAKDOWN.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `Rs. ${formatIndianCurrency(value)}`,
                      item.payload.categoryNameEn
                    ]}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown Cards */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {CATEGORY_REVENUE_BREAKDOWN.map((cat) => (
                <div key={cat.category} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight text-[11px]">
                        {isMizo ? cat.categoryNameMizo : cat.categoryNameEn}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {cat.taskCount} tasks
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-slate-900 font-bold text-xs flex items-center">
                    <Rupee className="w-3 h-3 text-slate-900" />
                    <span>{formatIndianCurrency(cat.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
