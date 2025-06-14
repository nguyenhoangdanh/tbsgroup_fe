import React, { forwardRef, useEffect } from 'react';
import { useRoleContext } from '@/hooks/roles/roleContext';
import { useUserContext } from '@/hooks/users/UserContext';
import UserForm from './components/UserForm';

// Update props to include ref and additional data
interface UserFormWrapperProps {
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
    lines?: any[];
    teams?: any[];
    groups?: any[];
    departments?: any[];
  };
  loadingStates?: {
    factories?: boolean;
    lines?: boolean;
    teams?: boolean;
    groups?: boolean;
    departments?: boolean;
  };
  [key: string]: any;
}

// Use forwardRef to properly receive ref from parent components
const UserFormWrapper = forwardRef<any, UserFormWrapperProps>((props, ref) => {
  const { getAllRoles } = useRoleContext();
  const { relatedData, loadingStates } = useUserContext();
  const roleQuery = getAllRoles;
  
  // Debug the incoming props to see what's being received
  console.log("[UserFormWrapper] Received props:", {
    data: props.data,
    dialogType: props.dialogType,
    hasOnSubmit: !!props.onSubmit,
    additionalData: props.additionalData,
    relatedDataCounts: {
      factories: relatedData?.factories?.length || 0,
      lines: relatedData?.lines?.length || 0,
      teams: relatedData?.teams?.length || 0,
      groups: relatedData?.groups?.length || 0,
    }
  });
  
  // Add explicit console logging for when UserFormWrapper mounts and unmounts
  useEffect(() => {
    console.log("[UserFormWrapper] Component mounted with dialogType:", props.dialogType);
    return () => {
      console.log("[UserFormWrapper] Component unmounting");
    };
  }, [props.dialogType]);
  
  // Create safe role options
  const safeRoleOptions = React.useMemo(() => {
    const roleData = roleQuery?.data || [];
    console.log("[UserFormWrapper] Processing role options from API:", roleData.length);
    return roleData.map((role: any, index: number) => ({
      value: role.id || `role-${index}`,
      label: role.name || `Role ${index + 1}`
    }));
  }, [roleQuery?.data]);

  // Create factory options
  const factoryOptions = React.useMemo(() => {
    const factoryData = relatedData?.factories || props.additionalData?.factories || [];
    console.log("[UserFormWrapper] Processing factory options:", factoryData.length);
    return factoryData.map((factory: any, index: number) => ({
      value: factory.id || `factory-${index}`,
      label: factory.name || `Factory ${index + 1}`
    }));
  }, [relatedData?.factories, props.additionalData?.factories]);

  // Create line options
  const lineOptions = React.useMemo(() => {
    const lineData = relatedData?.lines || props.additionalData?.lines || [];
    console.log("[UserFormWrapper] Processing line options:", lineData.length);
    return lineData.map((line: any, index: number) => ({
      value: line.id || `line-${index}`,
      label: line.name || `Line ${index + 1}`
    }));
  }, [relatedData?.lines, props.additionalData?.lines]);

  // Create team options
  const teamOptions = React.useMemo(() => {
    const teamData = relatedData?.teams || props.additionalData?.teams || [];
    console.log("[UserFormWrapper] Processing team options:", teamData.length);
    return teamData.map((team: any, index: number) => ({
      value: team.id || `team-${index}`,
      label: team.name || `Team ${index + 1}`
    }));
  }, [relatedData?.teams, props.additionalData?.teams]);

  // Create group options
  const groupOptions = React.useMemo(() => {
    const groupData = relatedData?.groups || props.additionalData?.groups || [];
    console.log("[UserFormWrapper] Processing group options:", groupData.length);
    return groupData.map((group: any, index: number) => ({
      value: group.id || `group-${index}`,
      label: group.name || `Group ${index + 1}`
    }));
  }, [relatedData?.groups, props.additionalData?.groups]);

  // For create forms, default to delay validation
  const shouldDelayValidation = props.dialogType === 'create';
  
  // Check if related data is still loading
  const isRelatedDataLoading = loadingStates?.factories || 
                               loadingStates?.lines || 
                               loadingStates?.teams || 
                               loadingStates?.groups ||
                               props.loadingStates?.factories ||
                               props.loadingStates?.lines ||
                               props.loadingStates?.teams ||
                               props.loadingStates?.groups;
  
  console.log("[UserFormWrapper] Rendering UserForm with dialogType:", props.dialogType);
  console.log("[UserFormWrapper] Related data loading states:", {
    factories: loadingStates?.factories,
    lines: loadingStates?.lines,
    teams: loadingStates?.teams,
    groups: loadingStates?.groups,
  });
  
  return (
    <UserForm 
      {...props} 
      roles={safeRoleOptions}
      factories={factoryOptions}
      lines={lineOptions}
      teams={teamOptions}
      groups={groupOptions}
      delayValidation={shouldDelayValidation}
      skipInitialValidation={props.dialogType === 'create' ? true : props.skipInitialValidation}
      loading={props.loading || isRelatedDataLoading}
      ref={ref}
    />
  );
});

// Set display name for DevTools
UserFormWrapper.displayName = 'UserFormWrapper';

export default UserFormWrapper;
