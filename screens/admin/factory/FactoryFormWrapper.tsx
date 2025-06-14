import React, { forwardRef, useEffect } from 'react';

import { useFactoryContext } from '@/hooks/factory/FactoryContext';

import FactoryForm from './components/FactoryForm';

interface FactoryFormWrapperProps {
  data?: any;
  dialogType?: 'create' | 'edit' | 'view' | 'delete' | 'custom';
  onSubmit?: (data: any) => Promise<boolean> | boolean;
  onClose?: () => void;
  isReadOnly?: boolean;
  loading?: boolean;
  error?: any;
  onFormDirty?: (isDirty: boolean) => void;
  skipInitialValidation?: boolean;
  additionalData?: {
    departments?: any[];
    users?: any[];
  };
  loadingStates?: {
    departments?: boolean;
    users?: boolean;
  };
  [key: string]: any;
}

const FactoryFormWrapper = forwardRef<any, FactoryFormWrapperProps>((props, ref) => {
  const { relatedData, loadingStates } = useFactoryContext();
  
  console.log("[FactoryFormWrapper] Received props:", {
    data: props.data,
    dialogType: props.dialogType,
    hasOnSubmit: !!props.onSubmit,
    additionalData: props.additionalData,
    relatedDataCounts: {
      departments: relatedData?.departments?.length || 0,
      users: relatedData?.users?.length || 0,
    }
  });
  
  useEffect(() => {
    console.log("[FactoryFormWrapper] Component mounted with dialogType:", props.dialogType);
    return () => {
      console.log("[FactoryFormWrapper] Component unmounting");
    };
  }, [props.dialogType]);
  
  // Create department options
  const departmentOptions = React.useMemo(() => {
    const departmentData = relatedData?.departments || props.additionalData?.departments || [];
    console.log("[FactoryFormWrapper] Processing department options:", departmentData.length);
    return departmentData.map((department: any, index: number) => ({
      value: department.id || `department-${index}`,
      label: department.name || `Department ${index + 1}`
    }));
  }, [relatedData?.departments, props.additionalData?.departments]);

  // Create user options
  const userOptions = React.useMemo(() => {
    const userData = relatedData?.users || props.additionalData?.users || [];
    console.log("[FactoryFormWrapper] Processing user options:", userData.length);
    return userData.map((user: any, index: number) => ({
      value: user.id || `user-${index}`,
      label: user.fullName || user.username || `User ${index + 1}`
    }));
  }, [relatedData?.users, props.additionalData?.users]);

  // For create forms, default to delay validation
  const shouldDelayValidation = props.dialogType === 'create';
  
  // Check if related data is still loading
  const isRelatedDataLoading = loadingStates?.departments || 
                               loadingStates?.users ||
                               props.loadingStates?.departments ||
                               props.loadingStates?.users;
  
  console.log("[FactoryFormWrapper] Rendering FactoryForm with dialogType:", props.dialogType);
  console.log("[FactoryFormWrapper] Related data loading states:", {
    departments: loadingStates?.departments,
    users: loadingStates?.users,
  });
  
  return (
    <FactoryForm 
      {...props} 
      departments={departmentOptions}
      users={userOptions}
      delayValidation={shouldDelayValidation}
      skipInitialValidation={props.dialogType === 'create' ? true : props.skipInitialValidation}
      loading={props.loading || isRelatedDataLoading}
      ref={ref}
    />
  );
});

FactoryFormWrapper.displayName = 'FactoryFormWrapper';

export default FactoryFormWrapper;
