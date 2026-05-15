import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

interface DomainScore {
  domain: string;
  score: number;
}

interface Props {
  data: DomainScore[];
}

export function DomainRadarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#E2EAF4" />
        <PolarAngleAxis
          dataKey="domain"
          tick={{ fontSize: 11, fill: '#555', fontFamily: '"Tex Gyre Heros", Arimo, sans-serif' }}
        />
        <Tooltip
          formatter={(value) => [`${value ?? 0} pts`, 'Avg score']}
          contentStyle={{
            borderRadius: 8,
            border: 'none',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            fontSize: 12,
            fontFamily: '"Tex Gyre Heros", Arimo, sans-serif',
          }}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#6491C0"
          fill="#6491C0"
          fillOpacity={0.25}
          strokeWidth={2}
          dot={{ fill: '#003361', r: 3 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
