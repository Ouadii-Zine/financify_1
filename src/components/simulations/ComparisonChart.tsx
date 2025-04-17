
import { 
  BarChart, 
  ResponsiveContainer, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface ComparisonChartProps {
  data: Array<{
    name: string;
    base: number;
    scenario: number;
  }>;
  scenarioName: string;
}

const ComparisonChart = ({ data, scenarioName }: ComparisonChartProps) => {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value: number, name: string, props: any) => {
              if (props.dataKey === 'base') {
                return [
                  new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR', 
                    maximumFractionDigits: 0 
                  }).format(value * (props.name === 'RWA' ? 1000000 : 1)),
                  'Base'
                ];
              } else {
                return [
                  new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR', 
                    maximumFractionDigits: 0 
                  }).format(value * (props.name === 'RWA' ? 1000000 : 1)),
                  'Scénario'
                ];
              }
            }}
          />
          <Legend />
          <Bar dataKey="base" fill="#2D5BFF" name="Base" />
          <Bar dataKey="scenario" fill="#FF3B5B" name="Scénario" />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-center text-xs text-muted-foreground mt-2">
        * RWA affichés en millions d'euros
      </div>
    </div>
  );
};

export default ComparisonChart;
