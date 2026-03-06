/**
 * PriceTrendChart — Interactive line chart with time range selector
 *
 * Features:
 * - 3 lines: Low (red), Mid (gold), High (green)
 * - Time range: 1M, 6M, 1Y, 5Y, ALL
 * - Desktop: hover over chart to see tooltip
 * - Mobile/Tablet: tap and hold to see tooltip
 * - Y-axis auto-scaling, X-axis date labels
 * - Theme-aware colors
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, PanResponder } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TIME_RANGE_OPTIONS, filterTrendByRange, type PricePoint, type PriceTrend, type TimeRange } from '../lib/data';

interface ChartLine {
  label: string;
  color: string;
  data: PricePoint[];
}

interface PriceTrendChartProps {
  trendData: PriceTrend;
  lineConfig: { label: string; color: string; key: 'low' | 'mid' | 'high' }[];
  colors: any;
  height?: number;
}

export function PriceTrendChart({ trendData, lineConfig, colors, height = 180 }: PriceTrendChartProps) {
  const [tooltip, setTooltip] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  const chartRef = useRef<View>(null);
  const chartLayoutRef = useRef({ x: 0, width: 1 });
  const chartWidth = Dimensions.get('window').width - 80;

  // Filter data by selected range
  const filtered = useMemo(() => filterTrendByRange(trendData, timeRange), [trendData, timeRange]);
  const lines: ChartLine[] = useMemo(() =>
    lineConfig.map(cfg => ({ label: cfg.label, color: cfg.color, data: filtered[cfg.key] })),
    [filtered, lineConfig]
  );

  const dates = lines[0]?.data.map(p => p.date) ?? [];
  const pointCount = dates.length;

  // Calculate bounds
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity, max = -Infinity;
    lines.forEach(line => {
      line.data.forEach(p => {
        if (p.value < min) min = p.value;
        if (p.value > max) max = p.value;
      });
    });
    const range = max - min || 1;
    return { minVal: Math.max(0, min - range * 0.08), maxVal: max + range * 0.08 };
  }, [lines]);

  const valueRange = maxVal - minVal || 1;
  const toY = (val: number) => height - ((val - minVal) / valueRange) * height;
  const toX = (idx: number) => pointCount > 1 ? (idx / (pointCount - 1)) * chartWidth : chartWidth / 2;

  // Format helpers
  const fmt = (val: number) => {
    if (val >= 100000) return `$${(val / 1000).toFixed(0)}k`;
    if (val >= 10000) return `$${(val / 1000).toFixed(1)}k`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toLocaleString()}`;
  };

  const fmtDate = (d: string) => {
    const [y, m] = d.split('-');
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(m)]} ${y}`;
  };

  const fmtDateShort = (d: string) => {
    const [y, m] = d.split('-');
    const monthNames = ['', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    if (timeRange === '1m' || timeRange === '6m') return `${monthNames[parseInt(m)]} '${y.slice(2)}`;
    if (timeRange === '1y') return `${monthNames[parseInt(m)]} '${y.slice(2)}`;
    return `'${y.slice(2)}`;
  };

  // Convert touch X position to data index
  const xToIndex = useCallback((pageX: number) => {
    const relX = pageX - chartLayoutRef.current.x;
    const pct = Math.max(0, Math.min(1, relX / chartLayoutRef.current.width));
    return Math.round(pct * (pointCount - 1));
  }, [pointCount]);

  // PanResponder for mobile touch tracking
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setTooltip(xToIndex(evt.nativeEvent.pageX));
    },
    onPanResponderMove: (evt) => {
      setTooltip(xToIndex(evt.nativeEvent.pageX));
    },
    onPanResponderRelease: () => {
      // Keep tooltip visible on mobile for a moment
      setTimeout(() => setTooltip(null), 1500);
    },
    onPanResponderTerminate: () => {
      setTooltip(null);
    },
  }), [xToIndex]);

  // Y-axis labels
  const yTicks = useMemo(() => [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    val: minVal + valueRange * pct,
    y: toY(minVal + valueRange * pct),
  })), [minVal, valueRange, height]);

  // X-axis labels — adaptive spacing
  const xLabelInterval = pointCount <= 8 ? 1 : pointCount <= 20 ? 3 : pointCount <= 50 ? 6 : Math.ceil(pointCount / 8);

  // Tooltip data
  const tooltipIdx = tooltip !== null ? Math.max(0, Math.min(tooltip, pointCount - 1)) : null;
  const tooltipData = tooltipIdx !== null ? {
    date: fmtDate(dates[tooltipIdx]),
    values: lines.map(l => ({
      label: l.label,
      color: l.color,
      value: l.data[tooltipIdx]?.value ?? 0,
    })),
    x: toX(tooltipIdx),
  } : null;

  // Price change for selected range
  const priceChange = useMemo(() => {
    if (lines[1]?.data.length < 2) return null;
    const midLine = lines[1].data; // Mid/NM line
    const first = midLine[0].value;
    const last = midLine[midLine.length - 1].value;
    const change = last - first;
    const pct = ((change / first) * 100).toFixed(1);
    return { change, pct, isUp: change >= 0 };
  }, [lines]);

  if (pointCount < 2) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>Not enough data for this range</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Time range selector */}
      <View style={st.rangeRow}>
        {TIME_RANGE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => { setTimeRange(opt.id); setTooltip(null); }}
            style={[st.rangeBtn, {
              backgroundColor: timeRange === opt.id ? colors.primaryContainer : 'transparent',
              borderColor: timeRange === opt.id ? colors.gold : colors.outline,
            }]}
          >
            <Text style={{
              fontSize: 11, fontWeight: timeRange === opt.id ? '800' : '500',
              color: timeRange === opt.id ? colors.gold : colors.onSurfaceVariant,
            }}>{opt.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Period change badge */}
        {priceChange && (
          <View style={[st.changeBadge, {
            backgroundColor: priceChange.isUp ? colors.success + '15' : colors.error + '15',
          }]}>
            <MaterialIcons
              name={priceChange.isUp ? 'trending-up' : 'trending-down'}
              size={12}
              color={priceChange.isUp ? colors.success : colors.error}
            />
            <Text style={{
              fontSize: 10, fontWeight: '700', marginLeft: 3,
              color: priceChange.isUp ? colors.success : colors.error,
            }}>
              {priceChange.isUp ? '+' : ''}{priceChange.pct}%
            </Text>
          </View>
        )}
      </View>

      {/* Tooltip */}
      {tooltipData && (
        <View style={[st.tooltip, {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
          left: Math.min(Math.max(tooltipData.x - 70, 0), chartWidth - 150) + 36,
        }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant, marginBottom: 4 }}>
            {tooltipData.date}
          </Text>
          {tooltipData.values.map(v => (
            <View key={v.label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14, marginBottom: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 3, borderRadius: 1.5, backgroundColor: v.color }} />
                <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{v.label}</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.onSurface }}>{fmt(v.value)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis */}
        <View style={{ width: 36, height, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 4 }}>
          {[...yTicks].reverse().map((t, i) => (
            <Text key={i} style={{ fontSize: 8, color: colors.onSurfaceVariant }}>{fmt(t.val)}</Text>
          ))}
        </View>

        {/* Chart area */}
        <View
          ref={chartRef}
          onLayout={(e) => {
            chartLayoutRef.current = { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width };
            // Also measure page position
            if (chartRef.current) {
              (chartRef.current as any).measureInWindow?.((x: number) => {
                if (x) chartLayoutRef.current.x = x;
              });
            }
          }}
          style={{ flex: 1, height, position: 'relative', borderLeftWidth: 1, borderBottomWidth: 1, borderColor: colors.outline }}
          {...panResponder.panHandlers}
          onMouseMove={Platform.OS === 'web' ? (e: any) => {
            const rect = e.currentTarget?.getBoundingClientRect?.();
            if (rect) {
              const relX = e.clientX - rect.left;
              const pct = Math.max(0, Math.min(1, relX / rect.width));
              setTooltip(Math.round(pct * (pointCount - 1)));
            }
          } : undefined}
          onMouseLeave={Platform.OS === 'web' ? () => setTooltip(null) : undefined}
        >

          {/* Grid lines */}
          {yTicks.map((t, i) => (
            <View key={i} style={{
              position: 'absolute', left: 0, right: 0, top: t.y, height: 1,
              borderBottomWidth: 1, borderStyle: 'dashed', borderColor: colors.outlineVariant,
            }} />
          ))}

          {/* Lines */}
          {lines.map((line) => (
            <View key={line.label} style={StyleSheet.absoluteFill} pointerEvents="none">
              {line.data.map((point, idx) => {
                if (idx === 0) return null;
                const x1 = toX(idx - 1);
                const y1 = toY(line.data[idx - 1].value);
                const x2 = toX(idx);
                const y2 = toY(point.value);
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                return (
                  <View
                    key={idx}
                    style={{
                      position: 'absolute', left: x1, top: y1,
                      width: len, height: 2,
                      backgroundColor: line.color,
                      transform: [{ rotate: `${angle}deg` }],
                      transformOrigin: 'left center',
                      opacity: 0.85,
                    }}
                  />
                );
              })}

              {/* End dot only (or all dots if few points) */}
              {line.data.map((point, idx) => {
                const showDot = pointCount <= 20 || idx === pointCount - 1 || idx === tooltipIdx;
                if (!showDot) return null;
                return (
                  <View
                    key={`d${idx}`}
                    style={{
                      position: 'absolute',
                      left: toX(idx) - (idx === tooltipIdx ? 4 : 2.5),
                      top: toY(point.value) - (idx === tooltipIdx ? 4 : 2.5),
                      width: idx === tooltipIdx ? 8 : 5,
                      height: idx === tooltipIdx ? 8 : 5,
                      borderRadius: idx === tooltipIdx ? 4 : 2.5,
                      backgroundColor: line.color,
                      borderWidth: idx === tooltipIdx ? 2 : 0,
                      borderColor: '#fff',
                    }}
                  />
                );
              })}
            </View>
          ))}

          {/* Vertical hover line */}
          {tooltipIdx !== null && (
            <View style={{
              position: 'absolute', left: toX(tooltipIdx), top: 0,
              width: 1, height, backgroundColor: colors.onSurfaceVariant, opacity: 0.25,
            }} />
          )}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', marginLeft: 36, marginTop: 4, height: 16 }}>
        {dates.map((d, i) => {
          const show = i % xLabelInterval === 0 || i === dates.length - 1;
          if (!show) return null;
          return (
            <Text key={i} style={{
              position: 'absolute', left: toX(i) - 16,
              fontSize: 7, color: colors.onSurfaceVariant, width: 32, textAlign: 'center',
            }}>
              {fmtDateShort(d)}
            </Text>
          );
        })}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 }}>
        {lines.map(l => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 12, height: 3, borderRadius: 1.5, backgroundColor: l.color }} />
            <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Interaction hint */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6, gap: 4, opacity: 0.5 }}>
        <MaterialIcons name={Platform.OS === 'web' ? 'mouse' : 'touch-app'} size={10} color={colors.onSurfaceVariant} />
        <Text style={{ fontSize: 9, color: colors.onSurfaceVariant }}>
          {Platform.OS === 'web' ? 'Hover to see prices' : 'Touch & drag to see prices'}
        </Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  rangeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14,
  },
  rangeBtn: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1,
  },
  changeBadge: {
    flexDirection: 'row', alignItems: 'center', marginLeft: 'auto',
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6,
  },
  tooltip: {
    position: 'absolute', top: 20, zIndex: 10,
    padding: 10, borderRadius: 8, borderWidth: 1,
    minWidth: 140,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
});
