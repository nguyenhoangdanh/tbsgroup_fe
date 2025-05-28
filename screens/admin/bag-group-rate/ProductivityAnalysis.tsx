'use client';

import {
  Loader2,
  AlertCircle,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  Activity,
} from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

import { BagGroupRateContextBridge } from './BagGroupRateContextBridge';

import { DashboardCardComponent } from '@/components/common/layouts/admin/DashboardCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBagGroupRateContext } from '@/hooks/group/bag-group-rate/BagGroupRateContext';

interface ProductivityAnalysisProps {
  handBagId: string;
}

interface GroupData {
  groupName: string;
  outputRate: number;
  groupId: string;
  notes?: string;
}

interface AnalysisData {
  handBag: {
    id: string;
    code: string;
    name: string;
    description?: string;
  };
  groups: GroupData[];
  averageOutputRate: number;
  highestOutputRate: number;
  lowestOutputRate: number;
}

type ChartType = 'bar' | 'area' | 'pie' | 'line' | 'radar';

const ProductivityAnalysis: React.FC<ProductivityAnalysisProps> = props => {
  return (
    <BagGroupRateContextBridge>
      <ProductivityAnalysisContent {...props} />
    </BagGroupRateContextBridge>
  );
};

const ProductivityAnalysisContent: React.FC<ProductivityAnalysisProps> = ({ handBagId }) => {
  const { getProductivityAnalysis } = useBagGroupRateContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<ChartType>('bar');

  //Generate colors based on output rate values
  const colors = useMemo(() => {
    if (!analysisData) return [];

    //Calculate color based on performance compared to average
    return analysisData.groups.map(group => {
      const ratio = group.outputRate / analysisData.averageOutputRate;

      // Green for above average, blue for average, red for below average
      if (ratio >= 1.1) {
        return '#10b981'; // Green
      } else if (ratio >= 0.9) {
        return '#3b82f6'; // Blue
      } else {
        return '#ef4444'; // Red
      }
    });
  }, [analysisData]);

  //Fetch analysis data when handBagId changes
  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!handBagId) return;

      try {
        setLoading(true);
        setError(null);

        const result = await getProductivityAnalysis(handBagId);
        if (result) {
          setAnalysisData(result as AnalysisData);
        } else {
          setError('Không thể tải dữ liệu phân tích');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu phân tích');
        console.error('Error fetching productivity analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [handBagId, getProductivityAnalysis]);

  //Sort data by output rate for better visualization
  const sortedGroupData = useMemo(() => {
    if (!analysisData?.groups) return [];

    return [...analysisData.groups].sort((a, b) => b.outputRate - a.outputRate);
  }, [analysisData]);

  //Prepare data for pie chart
  const pieChartData = useMemo(() => {
    if (!sortedGroupData.length) return [];

    return sortedGroupData.map(group => ({
      name: group.groupName,
      value: group.outputRate,
    }));
  }, [sortedGroupData]);

  //Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Đang tải dữ liệu phân tích...</span>
      </div>
    );
  }

  //Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lỗi</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No data state
  if (!analysisData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Không có dữ liệu</AlertTitle>
        <AlertDescription>Không tìm thấy dữ liệu phân tích cho túi này</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Phân tích năng suất: {analysisData.handBag.code} - {analysisData.handBag.name}
          </CardTitle>
          <CardDescription>
            {analysisData.handBag.description ||
              'Phân tích năng suất sản xuất túi theo các nhóm khác nhau'}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-4 mb-6">
        {/* <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Năng suất trung bình</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {analysisData.averageOutputRate.toFixed(1)}
                            <span className="text-sm font-normal ml-1">sản phẩm/giờ</span>
                        </div>
                    </CardContent>
                </Card> */}

        {/* <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Năng suất cao nhất</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {analysisData.highestOutputRate.toFixed(1)}
                            <span className="text-sm font-normal ml-1">sản phẩm/giờ</span>
                        </div>
                    </CardContent>
                </Card> */}

        {/* <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Năng suất thấp nhất</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">
                            {analysisData.lowestOutputRate.toFixed(1)}
                            <span className="text-sm font-normal ml-1">sản phẩm/giờ</span>
                        </div>
                    </CardContent>
                </Card> */}

        <div className="flex-grow basis-60 max-w-xs min-w-60">
          <DashboardCardComponent
            title="Năng suất trung bình"
            data={analysisData.averageOutputRate.toFixed(1)}
            description="sản phẩm/giờ"
            icon={<BarChartIcon className="h-6 w-6 text-primary" />}
          />
        </div>
        <div className="flex-grow basis-60 max-w-xs min-w-60">
          <DashboardCardComponent
            title="Năng suất cao nhất"
            data={analysisData.highestOutputRate.toFixed(1)}
            description="sản phẩm/giờ"
            icon={<BarChartIcon className="h-6 w-6 text-green-600" />}
          />
        </div>
        <div className="flex-grow basis-60 max-w-xs min-w-60">
          <DashboardCardComponent
            title="Năng suất thấp nhất"
            data={analysisData.lowestOutputRate.toFixed(1)}
            description="sản phẩm/giờ"
            icon={<BarChartIcon className="h-6 w-6 text-red-500" />}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle>Năng suất theo nhóm</CardTitle>
            <CardDescription>So sánh năng suất giữa các nhóm sản xuất</CardDescription>
          </div>
          <Tabs
            defaultValue="bar"
            value={activeTab}
            onValueChange={value => setActiveTab(value as ChartType)}
            className="mt-4 sm:mt-0"
          >
            {/* <TabsList className="grid grid-cols-5 w-full sm:w-auto"> */}
            <TabsList className="flex flex-wrap gap-2 w-full sm:w-auto">
              <TabsTrigger
                value="bar"
                className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
              >
                <BarChartIcon className="w-3 h-3 sm:w-4 sm:h-4" /> Bar
              </TabsTrigger>
              <TabsTrigger
                value="area"
                className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
              >
                <AreaChartIcon className="w-3 h-3 sm:w-4 sm:h-4" /> Area
              </TabsTrigger>
              <TabsTrigger
                value="line"
                className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
              >
                <LineChartIcon className="w-3 h-3 sm:w-4 sm:h-4" /> Line
              </TabsTrigger>
              <TabsTrigger
                value="pie"
                className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
              >
                <PieChartIcon className="w-3 h-3 sm:w-4 sm:h-4" /> Pie
              </TabsTrigger>
              <TabsTrigger
                value="radar"
                className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
              >
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" /> Radar
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            {activeTab === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedGroupData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 70,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="groupName"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis
                    label={{
                      value: 'Sản phẩm/giờ',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' },
                    }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} sản phẩm/giờ`, 'Năng suất']}
                    labelFormatter={label => `Nhóm: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="outputRate" name="Năng suất" fill="#4f46e5" barSize={40}>
                    {sortedGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'area' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sortedGroupData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 70,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="groupName"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis
                    label={{
                      value: 'Sản phẩm/giờ',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' },
                    }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} sản phẩm/giờ`, 'Năng suất']}
                    labelFormatter={label => `Nhóm: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="outputRate"
                    name="Năng suất"
                    stroke="#4f46e5"
                    fill="#4f46e5"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'line' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sortedGroupData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 70,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="groupName"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis
                    label={{
                      value: 'Sản phẩm/giờ',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' },
                    }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} sản phẩm/giờ`, 'Năng suất']}
                    labelFormatter={label => `Nhóm: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="outputRate"
                    name="Năng suất"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{
                      stroke: '#4f46e5',
                      strokeWidth: 2,
                      r: 6,
                      fill: 'white',
                    }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'pie' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value} sản phẩm/giờ`, 'Năng suất']}
                    labelFormatter={name => `Nhóm: ${name}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'radar' && (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sortedGroupData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="groupName" />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, Math.ceil(analysisData.highestOutputRate * 1.1)]}
                  />
                  <Radar
                    name="Năng suất"
                    dataKey="outputRate"
                    stroke="#4f46e5"
                    fill="#4f46e5"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} sản phẩm/giờ`, 'Năng suất']}
                    labelFormatter={label => `Nhóm: ${label}`}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết năng suất theo nhóm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nhóm</th>
                  <th className="text-center p-2">Năng suất (SP/giờ)</th>
                  <th className="text-center p-2">% so với TB</th>
                  <th className="text-left p-2">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {sortedGroupData.map(group => {
                  const percentOfAvg = (group.outputRate / analysisData.averageOutputRate) * 100;

                  return (
                    <tr key={group.groupId} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{group.groupName}</td>
                      <td className="text-center p-2 font-medium">{group.outputRate.toFixed(1)}</td>
                      <td
                        className={`text-center p-2 font-medium ${
                          percentOfAvg >= 110
                            ? 'text-green-600'
                            : percentOfAvg < 90
                              ? 'text-red-500'
                              : 'text-blue-500'
                        }`}
                      >
                        {percentOfAvg.toFixed(0)}%
                      </td>
                      <td className="p-2 text-gray-600">{group.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductivityAnalysis;
