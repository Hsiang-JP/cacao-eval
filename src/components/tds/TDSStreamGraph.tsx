import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { useAnalysisResults } from '../../features/tds/hooks/useAnalysisResults';
import { SENSORY_PALETTE } from '../../shared/theme/sensory-theme';
import { useLanguage } from '../../context/LanguageContext';
import { ATTRIBUTE_LABELS } from '../../data/attributes';
import { TDSProfile } from '../../types';

interface TDSStreamGraphProps {
    profile: TDSProfile;
    allAttributeIds: string[];
}

const TDSStreamGraph: React.FC<TDSStreamGraphProps> = ({ profile, allAttributeIds }) => {
    const { language } = useLanguage();

    // Use "Compute-Once" hook instead of Real-Time "useRelativeDominance"
    const { streamData, loading } = useAnalysisResults(profile);

    // Filter attributes that actually show up in the chart (max value > 0)
    const activeAttributeIds = React.useMemo(() => {
        if (!streamData || streamData.length === 0) return [];
        const active = new Set<string>();
        streamData.forEach(p => {
            allAttributeIds.forEach(id => {
                if (p[id] > 0.01) active.add(id);
            });
        });
        return allAttributeIds.filter(id => active.has(id));
    }, [streamData, allAttributeIds]);

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading && (!streamData || streamData.length === 0)) {
        return (
            <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                <span className="text-cacao-500 animate-pulse font-medium">
                    {language === 'es' ? 'Analizando datos...' : 'Analyzing data...'}
                </span>
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold text-center mb-2 text-gray-700">
                {language === 'es' ? 'Evolución de Intensidad Relativa' : 'Relative Intensity Evolution'}
            </h3>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={streamData}
                    margin={{ top: 30, right: 30, left: 10, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

                    <XAxis
                        dataKey="time"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={formatTime}
                        interval="preserveStartEnd"
                        minTickGap={30}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />

                    {/* Y Axis Domain: 0 to 1 (Max saturation) */}
                    <YAxis domain={[0, 1]} tick={false} width={0} />

                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                // Sort by value desc
                                const sorted = [...payload].sort((a, b) => (b.value as number) - (a.value as number));

                                return (
                                    <div className="bg-white p-3 border border-gray-100 shadow-md rounded-lg text-xs z-50">
                                        <p className="font-bold mb-2">{formatTime(label as number)}</p>
                                        <ul className="space-y-1">
                                            {sorted.map((item: any) => {
                                                const val = (item.value as number) * 100;
                                                if (val < 1) return null; // Hide noise
                                                // Map color back to name if needed, usually we trust payload name
                                                return (
                                                    <li key={item.name} className="flex items-center gap-2 justify-between">
                                                        <span className="flex items-center gap-2">
                                                            <span
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: item.color }}
                                                            />
                                                            <span className="text-gray-600">
                                                                {ATTRIBUTE_LABELS[item.name]?.[language] || item.name}
                                                            </span>
                                                        </span>
                                                        <span className="font-bold">{val.toFixed(0)}%</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />

                    {activeAttributeIds.map((attrId: string) => {
                        // Type assertion safe here as keys of SENSORY_PALETTE.attributes are strings
                        const color = (SENSORY_PALETTE.attributes as any)[attrId] || SENSORY_PALETTE.attributes.default;
                        return (
                            <Area
                                key={attrId}
                                type="monotone"
                                dataKey={attrId}
                                stackId="1"
                                stroke={color}
                                fill={color}
                                fillOpacity={0.8}
                                strokeWidth={0}
                                activeDot={false}
                                isAnimationActive={false}
                            />
                        );
                    })}

                    {profile.swallowTime > 0 && (
                        <ReferenceLine
                            x={profile.swallowTime}
                            stroke="#000"
                            strokeDasharray="3 3"
                            label={{
                                value: language === 'es' ? 'Tragar' : 'Swallow',
                                position: 'top',
                                fill: '#000',
                                fontSize: 12,
                                fontWeight: 'bold',
                                dy: -3
                            }}
                        />
                    )}
                    {profile.swallowTime > 0 && (
                        <ReferenceLine
                            x={profile.swallowTime}
                            stroke="none"
                            label={{
                                value: formatTime(profile.swallowTime),
                                position: 'insideBottom',
                                fill: '#000',
                                fontSize: 11,
                                fontWeight: 'bold',
                                dy: -10,
                                dx: 25
                            }}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>

            {/* External HTML Legend for better responsiveness */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-1 px-2">
                {activeAttributeIds.map(attrId => {
                    const color = (SENSORY_PALETTE.attributes as any)[attrId] || SENSORY_PALETTE.attributes.default;
                    return (
                        <div key={attrId} className="flex items-center gap-1.5">
                            <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                                {ATTRIBUTE_LABELS[attrId]?.[language] || attrId}
                            </span>
                        </div>
                    );
                })}
            </div>

        </div >
    );
};

export default TDSStreamGraph;
