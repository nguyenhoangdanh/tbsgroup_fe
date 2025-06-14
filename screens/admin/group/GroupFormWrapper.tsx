import React, { forwardRef, useEffect } from 'react';
import { useGroupContext } from '@/hooks/group/GroupContext';
import GroupForm from './components/GroupForm';

interface GroupFormWrapperProps {
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
    teams?: any[];
    leaders?: any[];
  };
  loadingStates?: {
    teams?: boolean;
    leaders?: boolean;
  };
  [key: string]: any;
}

const GroupFormWrapper = forwardRef<any, GroupFormWrapperProps>((props, ref) => {
  const { relatedData, loadingStates } = useGroupContext();
  
  console.log("[GroupFormWrapper] Received props:", {
    data: props.data,
    dialogType: props.dialogType,
    hasOnSubmit: !!props.onSubmit,
    additionalData: props.additionalData,
    relatedDataCounts: {
      teams: relatedData?.teams?.length || 0,
      leaders: relatedData?.leaders?.length || 0,
    }
  });
  
  useEffect(() => {
    console.log("[GroupFormWrapper] Component mounted with dialogType:", props.dialogType);
    return () => {
      console.log("[GroupFormWrapper] Component unmounting");
    };
  }, [props.dialogType]);
  
  // Create team options
  const teamOptions = React.useMemo(() => {
    const teamData = relatedData?.teams || props.additionalData?.teams || [];
    console.log("[GroupFormWrapper] Processing team options:", teamData.length);
    return teamData.map((team: any, index: number) => ({
      value: team.id || `team-${index}`,
      label: team.name || `Team ${index + 1}`
    }));
  }, [relatedData?.teams, props.additionalData?.teams]);

  // Create leader options
  const leaderOptions = React.useMemo(() => {
    const leaderData = relatedData?.users || props.additionalData?.leaders || [];
    console.log("[GroupFormWrapper] Processing leader options:", leaderData.length);
    return leaderData.map((leader: any, index: number) => ({
      value: leader.id || `leader-${index}`,
      label: leader.fullName || leader.username || `Leader ${index + 1}`
    }));
  }, [relatedData?.users, props.additionalData?.leaders]);

  // For create forms, default to delay validation
  const shouldDelayValidation = props.dialogType === 'create';
  
  // Check if related data is still loading
  const isRelatedDataLoading = loadingStates?.teams || 
                               loadingStates?.leaders ||
                               props.loadingStates?.teams ||
                               props.loadingStates?.leaders;
  
  console.log("[GroupFormWrapper] Rendering GroupForm with dialogType:", props.dialogType);
  console.log("[GroupFormWrapper] Related data loading states:", {
    teams: loadingStates?.teams,
    leaders: loadingStates?.leaders,
  });
  
  return (
    <GroupForm 
      {...props} 
      teams={teamOptions}
      leaders={leaderOptions}
      delayValidation={shouldDelayValidation}
      skipInitialValidation={props.dialogType === 'create' ? true : props.skipInitialValidation}
      loading={props.loading || isRelatedDataLoading}
      ref={ref}
    />
  );
});

GroupFormWrapper.displayName = 'GroupFormWrapper';

export default GroupFormWrapper;
