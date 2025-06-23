
import {
  ComposedChart,
  ResponsiveContainer,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface SensitivityChartProps {
  data: Array<{
    name: string;
    el: number;
    rwa: number;
    roe: number;
  }>;
}

const SensitivityChart = ({ data }: SensitivityChartProps) => {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'roe') {
                return [`${value.toFixed(2)}%`, 'ROE'];
              } else if (name === 'el') {
                return [
                  new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR', 
                    maximumFractionDigits: 0 
                  }).format(value),
                  'Expected Loss'
                ];
              } else {
                return [
                  new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR', 
                    maximumFractionDigits: 0 
                  }).format(value),
                  'RWA'
                ];
              }
            }}
          />
          <Legend />
          <Bar dataKey="el" yAxisId="left" fill="#FF3B5B" name="Expected Loss" />
          <Bar dataKey="rwa" yAxisId="left" fill="#2D5BFF" name="RWA" barSize={20} />
          <Line type="monotone" dataKey="roe" yAxisId="right" stroke="#00C48C" name="ROE (%)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensitivityChart;
