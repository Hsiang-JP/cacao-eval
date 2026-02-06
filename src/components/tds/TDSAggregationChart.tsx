import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { AggregatedTDSResult } from '../../utils/tdsAnalytics';
import { getAttributeColor } from '../../utils/colors';
import { useLanguage } from '../../context/LanguageContext';
import { ATTRIBUTE_LABELS } from '../../data/attributes';

interface TDSAggregationChartProps {
    data: AggregatedTDSResult;
    attributeIds: string[];
}

const TDSAggregationChart: React.FC<TDSAggregationChartProps> = ({ data, attributeIds }) => {
    const { language } = useLanguage();

    // Transform data for Recharts
    const chartData = useMemo(() => {
        return data.curves.map(point => {
            const row: any = { time: point.timePercent };
            attributeIds.forEach(attrId => {
                row[attrId] = (point.dominanceRates[attrId] || 0) * 100;
            });
            return row;
        });
    }, [data.curves, attributeIds]);

    const [highlightedAttributes, setHighlightedAttributes] = React.useState<Set<string>>(new Set());

    const handleLegendClick = (e: any) => {
        const targetId = e.dataKey;
        setHighlightedAttributes(prev => {
            const next = new Set(prev);
            if (next.has(targetId)) {
                next.delete(targetId);
            } else {
                next.add(targetId);
            }
            return next;
        });
    };

    const getOpacity = (attrId: string) => {
        if (highlightedAttributes.size === 0) return 1;
        return highlightedAttributes.has(attrId) ? 1 : 0.1;
    };

    const chanceLevelPercent = (data.chanceLevel || 0) * 100;
    const significanceLevelPercent = (data.significanceLevel || 0) * 100;

    return (
        <div className="w-full h-[500px] md:h-[600px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold text-center mb-4 text-gray-700">
                {language === 'es' ? 'Curvas de Dominancia Temporal Agregadas' : 'Aggregated Temporal Dominance Curves'}
            </h3>

            <p className="text-xs text-center text-gray-400 mb-2">
                {language === 'es'
                    ? 'Toque en la leyenda para resaltar tendencias específicas.'
                    : 'Tap on legend items to highlight specific trends.'}
            </p>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

                        <XAxis
                            dataKey="time"
                            type="number"
                            domain={[0, 130]}
                            ticks={[0, 25, 50, 75, 100, 130]}
                            label={{
                                value: language === 'es' ? '% Duración Normalizada' : '% Normalized Duration',
                                position: 'insideBottom',
                                offset: -10,
                                style: { fill: '#9ca3af', fontSize: 12 }
                            }}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickFormatter={(value) => {
                                if (value <= 100) return `${value}%`;
                                return `+${value - 100}%`;
                            }}
                        />

                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickFormatter={(value) => `${Math.round(value)}%`}
                            width={35} // Just enough for "100%"
                        />

                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const validItems = payload
                                        .filter(item => (item.value as number) > 0)
                                        .sort((a, b) => (b.value as number) - (a.value as number));

                                    if (validItems.length === 0) return null;

                                    const timeVal = label as number;
                                    const isAftertaste = timeVal > 100;
                                    const displayTime = isAftertaste ? `+${timeVal - 100}%` : `${timeVal}%`;
                                    const phaseLabel = isAftertaste
                                        ? (language === 'es' ? 'Retrogusto' : 'Aftertaste')
                                        : (language === 'es' ? 'Fase Oral' : 'Oral Phase');

                                    return (
                                        <div className="bg-white p-3 border border-gray-100 shadow-md rounded-lg text-xs md:text-sm">
                                            <div className="font-bold text-gray-700 mb-2 border-b border-gray-100 pb-1 flex justify-between">
                                                <span>{displayTime}</span>
                                                <span className="text-gray-400 font-normal">{phaseLabel}</span>
                                            </div>
                                            <ul className="space-y-1">
                                                {validItems.map((item: any) => (
                                                    <li key={item.name} className="flex items-center gap-2 justify-between min-w-[150px]">
                                                        <span className="flex items-center gap-2">
                                                            <span
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: item.color }}
                                                            />
                                                            <span className="text-gray-600 font-medium">
                                                                {ATTRIBUTE_LABELS[item.name]?.[language] || item.name}
                                                            </span>
                                                        </span>
                                                        <span className="font-bold text-gray-800">
                                                            {Number(item.value).toFixed(1)}%
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            onClick={handleLegendClick}
                            cursor="pointer"
                            formatter={(value, entry: any) => {
                                const isHighlighted = highlightedAttributes.has(entry.dataKey);
                                const isDimmed = highlightedAttributes.size > 0 && !isHighlighted;
                                return (
                                    <span className={`text-xs md:text-sm transition-opacity ${isDimmed ? 'opacity-40' : 'opacity-100'} font-medium`}>
                                        {value}
                                    </span>
                                );
                            }}
                        />

                        <ReferenceLine
                            x={100}
                            stroke="#374151"
                            strokeWidth={2}
                            label={{
                                value: language === 'es' ? 'TRAGAR' : 'SWALLOW',
                                position: 'top',
                                fill: '#374151',
                                fontSize: 11,
                                fontWeight: 'bold'
                            }}
                        />

                        <ReferenceLine
                            y={chanceLevelPercent}
                            stroke="#9ca3af"
                            strokeDasharray="5 5"
                            label={{
                                value: 'P0',
                                position: 'right',
                                fill: '#9ca3af',
                                fontSize: 10
                            }}
                        />
                        <ReferenceLine
                            y={significanceLevelPercent}
                            stroke="#6b7280"
                            strokeWidth={2}
                            label={{
                                value: 'Ps',
                                position: 'right',
                                fill: '#6b7280',
                                fontSize: 10,
                                fontWeight: 'bold'
                            }}
                        />

                        {attributeIds.map(attrId => (
                            <Line
                                key={attrId}
                                type="monotone"
                                dataKey={attrId}
                                stroke={getAttributeColor(attrId)}
                                strokeWidth={highlightedAttributes.has(attrId) ? 3 : 2}
                                strokeOpacity={getOpacity(attrId)}
                                dot={false}
                                activeDot={{ r: 6 }}
                                name={ATTRIBUTE_LABELS[attrId]?.[language] || attrId}
                                connectNulls
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-2 text-xs text-center text-gray-400 pt-4 border-t border-gray-100">
                <span className="font-bold">Ps:</span> {language === 'es' ? 'Nivel de Significancia' : 'Significance Level'} (95%)
                <span className="mx-2">|</span>
                <span className="font-bold">P0:</span> {language === 'es' ? 'Nivel de Azar' : 'Chance Level'}
            </div>
        </div>
    );
};

export default TDSAggregationChart;
