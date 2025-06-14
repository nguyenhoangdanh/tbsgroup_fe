import React, { forwardRef, useEffect } from 'react';

import { useLineContext } from '@/hooks/line/LineContext';

import LineForm from './components/LineForm';

interface LineFormWrapperProps {
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
    factories?: any[];
    managers?: any[];
  };
  loadingStates?: {
    factories?: boolean;
    managers?: boolean;
  };
  [key: string]: any;
}

const LineFormWrapper = forwardRef<any, LineFormWrapperProps>((props, ref) => {
  const { relatedData, loadingStates } = useLineContext();
  
  console.log("[LineFormWrapper] Received props:", {
    data: props.data,
    dialogType: props.dialogType,
    hasOnSubmit: !!props.onSubmit,
    additionalData: props.additionalData,
    relatedDataCounts: {
      factories: relatedData?.factories?.length || 0,
      managers: relatedData?.managers?.length || 0,
    }
  });
  
  useEffect(() => {
    console.log("[LineFormWrapper] Component mounted with dialogType:", props.dialogType);
    return () => {
      console.log("[LineFormWrapper] Component unmounting");
    };
  }, [props.dialogType]);
  
  // Create factory options
  const factoryOptions = React.useMemo(() => {
    const factoryData = relatedData?.factories || props.additionalData?.factories || [];
    console.log("[LineFormWrapper] Processing factory options:", factoryData.length);
    return factoryData.map((factory: any, index: number) => ({
      value: factory.id || `factory-${index}`,
      label: factory.name || `Factory ${index + 1}`
    }));
  }, [relatedData?.factories, props.additionalData?.factories]);

  // Create manager options
  const managerOptions = React.useMemo(() => {
    const managerData = relatedData?.managers || props.additionalData?.managers || [];
    console.log("[LineFormWrapper] Processing manager options:", managerData.length);
    return managerData.map((manager: any, index: number) => ({
      value: manager.id || `manager-${index}`,
      label: manager.fullName || manager.username || `Manager ${index + 1}`
    }));
  }, [relatedData?.managers, props.additionalData?.managers]);

  // For create forms, default to delay validation
  const shouldDelayValidation = props.dialogType === 'create';
  
  // Check if related data is still loading
  const isRelatedDataLoading = loadingStates?.factories || 
                               loadingStates?.managers ||
                               props.loadingStates?.factories ||
                               props.loadingStates?.managers;
  
  console.log("[LineFormWrapper] Rendering LineForm with dialogType:", props.dialogType);
  console.log("[LineFormWrapper] Related data loading states:", {
    factories: loadingStates?.factories,
    managers: loadingStates?.managers,
  });
  
  return (
    <LineForm 
      {...props} 
      factories={factoryOptions}
      managers={managerOptions}
      delayValidation={shouldDelayValidation}
      skipInitialValidation={props.dialogType === 'create' ? true : props.skipInitialValidation}
      loading={props.loading || isRelatedDataLoading}
      ref={ref}
    />
  );
});

LineFormWrapper.displayName = 'LineFormWrapper';

export default LineFormWrapper;
