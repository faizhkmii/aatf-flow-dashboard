// Chart style helpers that read CSS custom properties for theme-aware charts
export function getChartStyles() {
  const root = document.documentElement;
  const styles = getComputedStyle(root);

  return {
    gridColor: styles.getPropertyValue('--chart-grid').trim() || '#333',
    axisColor: styles.getPropertyValue('--chart-axis').trim() || '#888',
    tooltipBg: styles.getPropertyValue('--chart-tooltip-bg').trim() || '#171717',
    tooltipBorder: styles.getPropertyValue('--chart-tooltip-border').trim() || '#333',
    tooltipColor: styles.getPropertyValue('--foreground').trim() || '#fff',
  };
}
