import type { HistoryEntry, AnalysisResult } from '../types/analysis';

/**
 * Calculates total lines of code suggested for fixing across history and current results.
 * Heuristic: counts lines in 'fix_code' fields.
 */
export function calculateTotalImprovedLines(history: HistoryEntry[], currentResult: AnalysisResult | null): number {
  let totalLines = 0;
  
  history.forEach(entry => {
    entry.resultCache?.issues?.forEach(issue => {
      if (issue.fix_code) totalLines += issue.fix_code.split('\n').length;
    });
  });

  if (currentResult?.issues) {
    currentResult.issues.forEach(issue => {
      if (issue.fix_code) totalLines += issue.fix_code.split('\n').length;
    });
  }

  return totalLines;
}

/**
 * Prepares chart data for quality score progression.
 */
export function prepareChartData(history: HistoryEntry[], currentResult: AnalysisResult | null): number[] {
  const reversedHistory = [...history].reverse();
  const lastScores = reversedHistory.slice(-5).map(h => h.score);
  
  if (currentResult) {
    lastScores.push(currentResult.score);
  }
  
  const chartData = lastScores.length > 0 ? lastScores : [0];
  while (chartData.length < 5) {
    chartData.unshift(0);
  }
  
  return chartData.slice(-5);
}
