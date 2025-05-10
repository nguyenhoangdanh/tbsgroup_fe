// components/digital-form/reports/charts/OutputByBagChart.tsx
'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend} from 'recharts';

interface OutputByBagChartProps {
  data: Array<{
    handBagId: string;
    handBagCode: string;
    handBagName: string;
    totalOutput: number;
    percentage: number;
  }>;
}

export function OutputByBagChart({data}: OutputByBagChartProps) {
  // Generate colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Transform data for chart
  const chartData = data.map((item, index) => ({
    name: item.handBagName,
    value: item.totalOutput,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Phân bố sản lượng theo túi</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{width: '100%', height: 400}}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => {
                    return [`${value} sản phẩm (${props.payload.percentage}%)`, name];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Không có dữ liệu
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
