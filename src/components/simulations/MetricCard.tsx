
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  icon: ReactNode;
  iconColor: string;
  value: string;
  percentageChange: number;
}

const MetricCard = ({ title, icon, iconColor, value, percentageChange }: MetricCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <div className={`h-5 w-5 mr-1 ${iconColor}`}>{icon}</div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-sm text-muted-foreground mt-1">
          {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(2)}% vs base
        </p>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
