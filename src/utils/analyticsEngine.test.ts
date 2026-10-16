import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistrictMetrics,
  calculateGrowthRate,
  formatIndianCurrency,
} from './analyticsEngine.ts';
import type { DistrictMetric } from './analyticsEngine.ts';

test('calculateDistrictMetrics computes accurate totals and completion rates', () => {
  const dummyDistricts: DistrictMetric[] = [
    {
      districtId: 'aizawl',
      districtName: 'Aizawl',
      districtNameMizo: 'Aizawl',
      totalTasks: 1200,
      completedTasks: 1140, // 95%
      cancelledTasks: 60,
      completionRate: 95.0,
      totalRevenue: 240000,
      avgCompletionMinutes: 32,
      activeCouriers: 68,
      avgTerrainDifficulty: 3.8,
    },
    {
      districtId: 'lunglei',
      districtName: 'Lunglei',
      districtNameMizo: 'Lunglei',
      totalTasks: 400,
      completedTasks: 360, // 90%
      cancelledTasks: 40,
      completionRate: 90.0,
      totalRevenue: 75000,
      avgCompletionMinutes: 44,
      activeCouriers: 24,
      avgTerrainDifficulty: 4.1,
    },
    {
      districtId: 'champhai',
      districtName: 'Champhai',
      districtNameMizo: 'Champhai',
      totalTasks: 200,
      completedTasks: 170, // 85%
      cancelledTasks: 30,
      completionRate: 85.0,
      totalRevenue: 38000,
      avgCompletionMinutes: 38,
      activeCouriers: 15,
      avgTerrainDifficulty: 2.9,
    },
  ];

  const result = calculateDistrictMetrics(dummyDistricts);
  assert.equal(result.totalTasks, 1800);
  assert.equal(result.completedTasks, 1670);
  // (1670 / 1800) * 100 = 92.777... -> 92.8%
  assert.equal(result.overallCompletionRate, 92.8);
  assert.equal(result.totalGrossRevenue, 353000);
  assert.equal(result.platformCommissionRevenue, Math.round(353000 * 0.15));
  assert.equal(result.workerPayouts, 353000 - Math.round(353000 * 0.15));
  assert.equal(result.highestPerformingDistrict, 'Aizawl');
  assert.equal(result.lowestCompletionDistrict, 'Champhai');
});

test('calculateDistrictMetrics handles empty array safely', () => {
  const result = calculateDistrictMetrics([]);
  assert.equal(result.totalTasks, 0);
  assert.equal(result.overallCompletionRate, 0);
  assert.equal(result.totalGrossRevenue, 0);
});

test('calculateGrowthRate handles positive and negative percentage changes', () => {
  assert.equal(calculateGrowthRate(120, 100), 20.0);
  assert.equal(calculateGrowthRate(85, 100), -15.0);
  assert.equal(calculateGrowthRate(100, 0), 100);
  assert.equal(calculateGrowthRate(0, 0), 0);
});

test('formatIndianCurrency formats numbers according to Indian groupings', () => {
  assert.equal(formatIndianCurrency(150000), '1,50,000');
  assert.equal(formatIndianCurrency(2500), '2,500');
  assert.equal(formatIndianCurrency(80), '80');
});
