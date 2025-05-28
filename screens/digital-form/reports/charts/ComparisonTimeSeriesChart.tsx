'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComparisonTimeSeriesChartProps {
  data: Array<{
    date: string;
    dataPoints: Array<{
      id: string;
      name: string;
      output: number;
    }>;
  }>;
}

export function ComparisonTimeSeriesChart({ data }: ComparisonTimeSeriesChartProps) {
  // Transform data for chart display
  const chartData = data.map(item => {
    const result: any = {
      date: item.date,
    };

    //  Add data points for each entity
    item.dataPoints.forEach(point => {
      result[point.name] = point.output;
    });

    return result;
  });

  // Generate colors array (can be expanded with more colors)
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

  // Get all unique entity names
  const entityNames = data[0]?.dataPoints.map(point => point.name) || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Xu hướng sản lượng theo thời gian</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {entityNames.map((name, index) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={colors[index % colors.length]}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
