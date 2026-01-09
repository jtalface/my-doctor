/**
 * useCycleStats Hook
 * 
 * Calculate statistics from cycle history:
 * - Average cycle length
 * - Average period length
 * - Cycle regularity (regular/irregular based on std deviation)
 */

import { useMemo } from 'react';
import type { Cycle, CycleStats } from '../types/cycle';

export function useCycleStats(cycles: Cycle[]): CycleStats {
  return useMemo((): CycleStats => {
    // Filter out incomplete cycles (cycleLength = 0)
    const completeCycles = cycles.filter(c => c.cycleLength > 0);
    
    if (completeCycles.length === 0) {
      return {
        averageCycleLength: 0,
        averagePeriodLength: 0,
        cycleRegularity: 'irregular',
        cycleLengthStdDev: 0,
        totalCycles: 0,
        oldestCycleDate: null,
      };
    }
    
    // Calculate averages
    const totalCycleLength = completeCycles.reduce((sum, c) => sum + c.cycleLength, 0);
    const totalPeriodLength = completeCycles.reduce((sum, c) => sum + c.periodLength, 0);
    
    const averageCycleLength = totalCycleLength / completeCycles.length;
    const averagePeriodLength = totalPeriodLength / completeCycles.length;
    
    // Calculate standard deviation for cycle length
    const variance = completeCycles.reduce((sum, c) => {
      const diff = c.cycleLength - averageCycleLength;
      return sum + (diff * diff);
    }, 0) / completeCycles.length;
    
    const cycleLengthStdDev = Math.sqrt(variance);
    
    // Determine regularity (if std dev < 3 days, consider regular)
    const cycleRegularity = cycleLengthStdDev < 3 ? 'regular' : 'irregular';
    
    // Find oldest cycle date
    const oldestCycle = cycles.reduce((oldest, cycle) => {
      if (!oldest || cycle.startDate < oldest.startDate) {
        return cycle;
      }
      return oldest;
    }, cycles[0]);
    
    return {
      averageCycleLength: Math.round(averageCycleLength),
      averagePeriodLength: Math.round(averagePeriodLength),
      cycleRegularity,
      cycleLengthStdDev: Math.round(cycleLengthStdDev * 10) / 10, // Round to 1 decimal
      totalCycles: cycles.length,
      oldestCycleDate: oldestCycle?.startDate || null,
    };
  }, [cycles]);
}

