import React, { forwardRef, useEffect } from 'react';
import { useTeamContext } from '@/hooks/teams/TeamContext';
import TeamForm from './components/TeamForm';

interface TeamFormWrapperProps {
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
    lines?: any[];
    leaders?: any[];
  };
  loadingStates?: {
    lines?: boolean;
    leaders?: boolean;
  };
  [key: string]: any;
}

const TeamFormWrapper = forwardRef<any, TeamFormWrapperProps>((props, ref) => {
  const { relatedData, loadingStates } = useTeamContext();
  
  console.log("[TeamFormWrapper] Received props:", {
    data: props.data,
    dialogType: props.dialogType,
    hasOnSubmit: !!props.onSubmit,
    additionalData: props.additionalData,
    relatedDataCounts: {
      lines: relatedData?.lines?.length || 0,
      leaders: relatedData?.leaders?.length || 0,
    }
  });
  
  useEffect(() => {
    console.log("[TeamFormWrapper] Component mounted with dialogType:", props.dialogType);
    return () => {
      console.log("[TeamFormWrapper] Component unmounting");
    };
  }, [props.dialogType]);
  
  // Create line options
  const lineOptions = React.useMemo(() => {
    const lineData = relatedData?.lines || props.additionalData?.lines || [];
    console.log("[TeamFormWrapper] Processing line options:", lineData.length);
    return lineData.map((line: any, index: number) => ({
      value: line.id || `line-${index}`,
      label: line.name || `Line ${index + 1}`
    }));
  }, [relatedData?.lines, props.additionalData?.lines]);

  // Create leader options
  const leaderOptions = React.useMemo(() => {
    const leaderData = relatedData?.users || props.additionalData?.leaders || [];
    console.log("[TeamFormWrapper] Processing leader options:", leaderData.length);
    return leaderData.map((leader: any, index: number) => ({
      value: leader.id || `leader-${index}`,
      label: leader.fullName || leader.username || `Leader ${index + 1}`
    }));
  }, [relatedData?.users, props.additionalData?.leaders]);

  // For create forms, default to delay validation
  const shouldDelayValidation = props.dialogType === 'create';
  
  // Check if related data is still loading
  const isRelatedDataLoading = loadingStates?.lines || 
                               loadingStates?.leaders ||
                               props.loadingStates?.lines ||
                               props.loadingStates?.leaders;
  
  console.log("[TeamFormWrapper] Rendering TeamForm with dialogType:", props.dialogType);
  console.log("[TeamFormWrapper] Related data loading states:", {
    lines: loadingStates?.lines,
    leaders: loadingStates?.leaders,
  });
  
  return (
    <TeamForm 
      {...props} 
      lines={lineOptions}
      leaders={leaderOptions}
      delayValidation={shouldDelayValidation}
      skipInitialValidation={props.dialogType === 'create' ? true : props.skipInitialValidation}
      loading={props.loading || isRelatedDataLoading}
      ref={ref}
    />
  );
});

TeamFormWrapper.displayName = 'TeamFormWrapper';

export default TeamFormWrapper;
