'use client';

import React, { useCallback, useMemo } from 'react';
import { ArrowLeft, Building, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDepartmentContext } from '@/hooks/department/DepartmentContext';
import { DepartmentTreeNode } from '@/common/interface/department';

const OrganizationChart: React.FC = () => {
  const router = useRouter();
  const { relatedData, loadingStates } = useDepartmentContext();

  const handleBack = useCallback(() => {
    router.push('/admin/departments');
  }, [router]);

  // Render tree node
  const renderTreeNode = (node: DepartmentTreeNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className={`ml-${level * 4}`}>
        <Card className="mb-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {node.departmentType === 'HEAD_OFFICE' ? (
                  <Building className="h-5 w-5 text-blue-600" />
                ) : (
                  <Building2 className="h-5 w-5 text-green-600" />
                )}
                <div>
                  <h4 className="font-medium">{node.name}</h4>
                  <p className="text-sm text-muted-foreground">{node.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={node.departmentType === 'HEAD_OFFICE' ? 'default' : 'secondary'}>
                                {node.departmentType === 'HEAD_OFFICE' ? 'Văn phòng điều hành' : 'Văn phòng nhà máy'}
                </Badge>
                {hasChildren && (
                  <Badge variant="outline">{node.children.length} phòng ban con</Badge>
                )}
              </div>
            </div>
            {node.description && (
              <p className="text-sm text-muted-foreground mt-2">{node.description}</p>
            )}
          </CardContent>
        </Card>
        
        {hasChildren && (
          <div className="ml-6 border-l border-gray-200 pl-4">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loadingStates?.organizationTree) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Sơ đồ tổ chức</h1>
      </div>

      {/* Organization Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Cấu trúc tổ chức phòng ban</CardTitle>
          <CardDescription>
            Sơ đồ phân cấp các phòng ban trong tổ chức
          </CardDescription>
        </CardHeader>
        <CardContent>
          {relatedData?.organizationTree && relatedData.organizationTree.length > 0 ? (
            <div className="space-y-4">
              {relatedData.organizationTree.map(node => renderTreeNode(node))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Chưa có dữ liệu tổ chức</h3>
              <p className="text-muted-foreground">
                Hệ thống chưa có thông tin về cấu trúc tổ chức phòng ban
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationChart;
