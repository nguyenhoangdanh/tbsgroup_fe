'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PerformanceData {
  hour: string;
  totalOutput: number;
  plannedOutput: number;
  percentage?: number;
}

interface PerformanceOutputChartProps {
  data: PerformanceData[];
}

// Hàm để xác định màu dựa trên phần trăm hiệu suất
const getPerformanceColor = (percentage: number): string => {
  if (percentage >= 100) return '#D580FF'; // Tím sen - Giỏi
  if (percentage >= 95) return '#82ca9d'; // Xanh lá - Khá
  if (percentage >= 90) return '#FFD700'; // Vàng - Trung bình
  if (percentage >= 85) return '#FFA500'; // Cam - Yếu
  return '#FF0000'; // Đỏ - Kém
};

// Hàm để định dạng nhãn hiệu suất
const getPerformanceLabel = (percentage: number): string => {
  if (percentage >= 100) return 'Giỏi';
  if (percentage >= 95) return 'Khá';
  if (percentage >= 90) return 'Trung bình';
  if (percentage >= 85) return 'Yếu';
  return 'Kém';
};

// Custom Tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const percentage = item.percentage;
    const performanceLevel = getPerformanceLabel(Number(percentage));

    return (
      <div className="bg-white p-3 border rounded shadow-md">
        <p className="font-semibold">{`Giờ: ${label}`}</p>
        <p>{`Sản lượng thực tế: ${item.totalOutput}`}</p>
        <p>{`Sản lượng kế hoạch: ${item.plannedOutput}`}</p>
        <p style={{ color: getPerformanceColor(Number(percentage)) }}>
          {`Tỷ lệ: ${percentage}% (${performanceLevel})`}
        </p>
      </div>
    );
  }

  return null;
};

export function PerformanceOutputChart({ data }: PerformanceOutputChartProps) {
  // Xử lý dữ liệu để thêm phần trăm
  const processedData = data.map(item => ({
    ...item,
    percentage: parseFloat(((item.totalOutput / item.plannedOutput) * 100).toFixed(1)),
  }));

  // Tạo dữ liệu cho legend
  const legendItems = [
    { name: 'Giỏi (≥100%)', color: '#D580FF' },
    { name: 'Khá (95-<100%)', color: '#82ca9d' },
    { name: 'Trung bình (90-<95%)', color: '#FFD700' },
    { name: 'Yếu (85-<90%)', color: '#FFA500' },
    { name: 'Kém (<85%)', color: '#FF0000' },
  ];

  // Custom Legend component
  const CustomLegend = () => (
    <div className="flex flex-wrap gap-4 justify-center mt-2">
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <div
            className="w-4 h-4 mr-1"
            style={{ backgroundColor: item.color, display: 'inline-block' }}
          />
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Phân tích hiệu suất sản lượng theo giờ</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 400 }}>
          {processedData && processedData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart
                  data={processedData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis
                    domain={[0, 120]}
                    label={{
                      value: 'Phần trăm (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* Thêm các đường tham chiếu cho các mức */}
                  <ReferenceLine y={100} stroke="#D580FF" strokeDasharray="3 3" />
                  <ReferenceLine y={95} stroke="#82ca9d" strokeDasharray="3 3" />
                  <ReferenceLine y={90} stroke="#FFD700" strokeDasharray="3 3" />
                  <ReferenceLine y={85} stroke="#FFA500" strokeDasharray="3 3" />

                  <Bar dataKey="percentage" name="Tỷ lệ (%)">
                    {processedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getPerformanceColor(entry.percentage || 0)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <CustomLegend />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Không có dữ liệu
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
