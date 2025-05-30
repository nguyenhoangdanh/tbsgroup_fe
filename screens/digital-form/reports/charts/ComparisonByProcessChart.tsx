'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComparisonByProcessChartProps {
  data: Array<{
    processId: string;
    processCode: string;
    processName: string;
    dataPoints: Array<{
      id: string;
      name: string;
      output: number;
      efficiency: number;
    }>;
  }>;
}

export function ComparisonByProcessChart({ data }: ComparisonByProcessChartProps) {
  // Transform data for chart display
  const chartData = data.map(item => {
    const result: any = {
      name: item.processName,
    };

    // Add data points for each entity
    item.dataPoints.forEach(point => {
      result[point.name] = point.output;
    });

    return result;
  });

  // Generate colors array (can be expanded with more colors)
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">So sánh sản lượng theo công đoạn</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Legend />
              {data[0]?.dataPoints.map((point, index) => (
                <Bar key={point.id} dataKey={point.name} fill={colors[index % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
