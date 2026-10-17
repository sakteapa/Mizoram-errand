export interface DailyRevenueRecord {
  date: string;
  dayLabel: string;
  grossVolume: number;
  platformFee: number;
  workerEarnings: number;
  tasksCompleted: number;
  hillSurchargeSum: number;
}

export interface MonthlyRevenueRecord {
  month: string;
  monthMizo: string;
  year: number;
  grossVolume: number;
  platformFee: number;
  workerEarnings: number;
  completedTasks: number;
  growthPercentage: number;
}

export interface DistrictMetric {
  districtId: string;
  districtName: string;
  districtNameMizo: string;
  totalTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  completionRate: number; // 0 to 100
  totalRevenue: number;
  avgCompletionMinutes: number;
  activeCouriers: number;
  avgTerrainDifficulty: number; // 1 to 5
}

export interface CategoryRevenueMetric {
  category: string;
  categoryNameEn: string;
  categoryNameMizo: string;
  revenue: number;
  taskCount: number;
  color: string;
}

/**
 * Calculates district completion rate and summary statistics
 */
export function calculateDistrictMetrics(
  districts: DistrictMetric[],
  platformFeePercentage: number = 0
): {
  totalTasks: number;
  completedTasks: number;
  overallCompletionRate: number;
  totalGrossRevenue: number;
  platformCommissionRevenue: number;
  workerPayouts: number;
  highestPerformingDistrict: string;
  lowestCompletionDistrict: string;
} {
  if (districts.length === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      overallCompletionRate: 0,
      totalGrossRevenue: 0,
      platformCommissionRevenue: 0,
      workerPayouts: 0,
      highestPerformingDistrict: 'N/A',
      lowestCompletionDistrict: 'N/A',
    };
  }

  let totalTasks = 0;
  let completedTasks = 0;
  let totalGrossRevenue = 0;

  let highestRate = -1;
  let highestDistrict = '';
  let lowestRate = 101;
  let lowestDistrict = '';

  for (const d of districts) {
    totalTasks += d.totalTasks;
    completedTasks += d.completedTasks;
    totalGrossRevenue += d.totalRevenue;

    const rate = d.totalTasks > 0 ? (d.completedTasks / d.totalTasks) * 100 : 0;
    if (rate > highestRate) {
      highestRate = rate;
      highestDistrict = d.districtName;
    }
    if (rate < lowestRate) {
      lowestRate = rate;
      lowestDistrict = d.districtName;
    }
  }

  const overallCompletionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 1000) / 10 
    : 0;

  const commissionRate = Math.max(0, platformFeePercentage) / 100;
  const platformCommissionRevenue = Math.round(totalGrossRevenue * commissionRate);
  const workerPayouts = totalGrossRevenue - platformCommissionRevenue;

  return {
    totalTasks,
    completedTasks,
    overallCompletionRate,
    totalGrossRevenue,
    platformCommissionRevenue,
    workerPayouts,
    highestPerformingDistrict: highestDistrict,
    lowestCompletionDistrict: lowestDistrict,
  };
}

/**
 * Calculates month-over-month growth rate
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  const growth = ((current - previous) / previous) * 100;
  return Math.round(growth * 10) / 10;
}

/**
 * Formats Indian Currency with comma groupings (Lakhs / Thousands)
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}
