// usePermissionMatrix.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRoleContext } from '@/hooks/roles/roleContext';
import { usePermissionQueries } from '@/hooks/permission/usePermissionQueries';
import { usePermissionMutations } from '@/hooks/permission/usePermissionMutations';
import { toast } from '@/hooks/use-toast';
import { RoleItemType } from '@/apis/roles/role.api';
import { PermissionDTO } from '@/common/types/permission';
import { getPermissionsByRoleApi } from '@/apis/permission/permission.api';

// Define type for permission change
interface PermissionChange {
  roleId: string;
  permissionId: string;
  assigned: boolean;
}

export function usePermissionMatrix() {
  // State with TypeScript
  const [roles, setRoles] = useState<RoleItemType[]>([]);
  const [permissions, setPermissions] = useState<PermissionDTO[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [changes, setChanges] = useState<PermissionChange[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, PermissionDTO[]>>({});
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [initialLoadStarted, setInitialLoadStarted] = useState<boolean>(false);

  // Refs for current state values to avoid dependency cycles
  const rolesRef = useRef<RoleItemType[]>([]);
  const permissionsRef = useRef<PermissionDTO[]>([]);
  const matrixRef = useRef<Record<string, Record<string, boolean>>>({});
  const rolePermissionsMapRef = useRef<Record<string, PermissionDTO[]>>({});
  const loadingRef = useRef<boolean>(true);

  // Update refs when state changes
  useEffect(() => {
    rolesRef.current = roles;
  }, [roles]);

  useEffect(() => {
    permissionsRef.current = permissions;
  }, [permissions]);

  useEffect(() => {
    matrixRef.current = matrix;
  }, [matrix]);

  useEffect(() => {
    rolePermissionsMapRef.current = rolePermissionsMap;
  }, [rolePermissionsMap]);

  useEffect(() => {
    loadingRef.current = isLoading;
  }, [isLoading]);

  // Hooks
  const { getAllRoles } = useRoleContext();
  const { listPermissions } = usePermissionQueries();
  const { assignPermissionsToRoleMutation, removePermissionsFromRoleMutation } = usePermissionMutations();

  const permissionsQuery = listPermissions({});

  // Load roles
  const loadRoles = useCallback(async (): Promise<boolean> => {
    try {
      const result = await getAllRoles.refetch();
      if (result.data && Array.isArray(result.data)) {
        setRoles(result.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to load roles:", err);
      setError("Failed to load roles: " + (err instanceof Error ? err.message : String(err)));
      return false;
    }
  }, [getAllRoles]);
  
  // Load permissions
  const loadPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const result = await permissionsQuery.refetch();
      
      if (result.data?.data && Array.isArray(result.data.data)) {
        setPermissions(result.data.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to load permissions:", err);
      setError("Failed to load permissions");
      return false;
    }
  }, [permissionsQuery]);

  // Load permissions for a specific role
  const loadRolePermissions = useCallback(async (roleId: string): Promise<PermissionDTO[]> => {
    if (!roleId) {
      return [];
    }
    
    try {
      const response = await getPermissionsByRoleApi(roleId);
      if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error(`Failed to load permissions for role ${roleId}:`, err);
      return [];
    }
  }, []);

  // Load permissions for all roles
  const loadAllRolePermissions = useCallback(async (): Promise<boolean> => {
    const currentRoles = rolesRef.current;
    if (currentRoles.length === 0) return false;

    const newRolePermissions: Record<string, PermissionDTO[]> = {};
    let hasErrors = false;
    
    // Process roles in parallel for better performance using Promise.all
    try {
      const permissionPromises = currentRoles.map(async (role) => {
        try {
          const permissions = await loadRolePermissions(role.id);
          return { roleId: role.id, permissions };
        } catch (err) {
          console.error(`Failed to load permissions for role ${role.id}:`, err);
          hasErrors = true;
          return { roleId: role.id, permissions: [] };
        }
      });
      
      const results = await Promise.all(permissionPromises);
      
      results.forEach(({ roleId, permissions }) => {
        newRolePermissions[roleId] = permissions;
      });

      setRolePermissionsMap(newRolePermissions);
      return !hasErrors;
    } catch (err) {
      console.error("Failed to load role permissions:", err);
      setError("Failed to load role permissions");
      return false;
    }
  }, [loadRolePermissions]);

  // Build matrix
  const buildMatrix = useCallback((): void => {
    const currentRoles = rolesRef.current;
    const currentPermissions = permissionsRef.current;
    const currentRolePermissions = rolePermissionsMapRef.current;
    
    if (currentRoles.length === 0 || currentPermissions.length === 0) {
      return;
    }

    try {
      const newMatrix: Record<string, Record<string, boolean>> = {};

      // Create a map of permission IDs for faster lookup
      const permissionIdMap = new Map<string, boolean>();
      currentPermissions.forEach(permission => {
        if (permission.id) {
          permissionIdMap.set(permission.id, true);
        }
      });
      
      // Process each role
      currentRoles.forEach((role) => {
        if (!role.id) return;
        
        newMatrix[role.id] = {};
        
        // Initialize all permissions to false first
        currentPermissions.forEach(permission => {
          if (permission.id) {
            newMatrix[role.id][permission.id] = false;
          }
        });
        
        // Then set true for permissions the role has
        const rolePermissions = currentRolePermissions[role.id] || [];
        
        rolePermissions.forEach((permission) => {
          if (permission.id && permissionIdMap.has(permission.id)) {
            newMatrix[role.id][permission.id] = true;
          }
        });
      });

      setMatrix(newMatrix);
    } catch (err) {
      console.error("Failed to build matrix:", err);
      setError("Failed to build permission matrix");
    }
  }, []);

  // Toggle permission
  const togglePermission = useCallback((roleId: string, permissionId: string): void => {
    if (loadingRef.current) return;
    
    setMatrix(prev => {
      const currentValue = (prev[roleId]?.[permissionId] || false);
      const newValue = !currentValue;
      
      return {
        ...prev,
        [roleId]: {
          ...(prev[roleId] || {}),
          [permissionId]: newValue
        }
      };
    });

    setChanges(prev => {
      // Remove if already in changes list
      const filtered = prev.filter(
        change => !(change.roleId === roleId && change.permissionId === permissionId)
      );
      
      // Add the new change
      return [...filtered, { roleId, permissionId, assigned: !matrixRef.current[roleId]?.[permissionId] }];
    });
  }, []);

  // Save changes
  const saveChanges = useCallback(async (): Promise<void> => {
    if (changes.length === 0) {
      toast({
        title: "No changes",
        description: "No changes to save",
        variant: "default"
      });
      return;
    }

    setIsLoading(true);
    
    // Group by role and action
    const changesByRole: Record<string, { assign: string[], remove: string[] }> = {};
    changes.forEach(change => {
      if (!changesByRole[change.roleId]) {
        changesByRole[change.roleId] = { assign: [], remove: [] };
      }
      
      if (change.assigned) {
        changesByRole[change.roleId].assign.push(change.permissionId);
      } else {
        changesByRole[change.roleId].remove.push(change.permissionId);
      }
    });

    let successCount = 0;
    let errorCount = 0;

    try {
      // Execute changes
      for (const roleId in changesByRole) {
        const { assign, remove } = changesByRole[roleId];
        
        if (assign.length > 0) {
          try {
            await assignPermissionsToRoleMutation.mutateAsync({
              roleId,
              data: { permissionIds: assign }
            });
            successCount += assign.length;
          } catch (err) {
            console.error(`Failed to assign permissions to role ${roleId}:`, err);
            errorCount += assign.length;
          }
        }

        if (remove.length > 0) {
          try {
            await removePermissionsFromRoleMutation.mutateAsync({
              roleId,
              data: { permissionIds: remove }
            });
            successCount += remove.length;
          } catch (err) {
            console.error(`Failed to remove permissions from role ${roleId}:`, err);
            errorCount += remove.length;
          }
        }
      }

      // Show result
      if (errorCount === 0) {
        toast({
          title: "Changes saved",
          description: `Successfully saved all ${successCount} changes`,
          variant: "default"
        });
      } else if (successCount > 0) {
        toast({
          title: "Partial success",
          description: `Saved ${successCount} changes but encountered ${errorCount} errors`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed",
          description: `Could not save any of the ${changes.length} changes`,
          variant: "destructive"
        });
      }

      // Clear changes
      setChanges([]);
      
      // Reload role permissions
      await loadAllRolePermissions();
      // Then rebuild matrix based on new data
      buildMatrix();
    } catch (err) {
      console.error("Error saving changes:", err);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [changes, assignPermissionsToRoleMutation, removePermissionsFromRoleMutation, loadAllRolePermissions, buildMatrix]);

  // Refresh data
  const refreshData = useCallback(async (): Promise<void> => {
    if (loadingRef.current) {
      toast({
        title: "Already loading",
        description: "Please wait for the current operation to complete",
        variant: "default"
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Sequential loading in specific order
      const rolesLoaded = await loadRoles();
      if (!rolesLoaded) {
        setError("Failed to load roles");
        setIsLoading(false);
        return;
      }
      
      const permissionsLoaded = await loadPermissions();
      if (!permissionsLoaded) {
        setError("Failed to load permissions");
        setIsLoading(false);
        return;
      }
      
      // Only proceed if both roles and permissions loaded successfully
      await loadAllRolePermissions();
      
      // Build matrix
      buildMatrix();
      setIsLoading(false);
        
      toast({
        title: "Data refreshed",
        description: "Permission matrix has been refreshed",
        variant: "default"
      });
    } catch (err) {
      console.error("Failed to refresh data:", err);
      setError("Failed to refresh data: " + (err instanceof Error ? err.message : String(err)));
      
      toast({
        title: "Refresh failed",
        description: "Could not refresh permission data. Please try again later.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [loadRoles, loadPermissions, loadAllRolePermissions, buildMatrix]);

  // Initial data load - RUN ONLY ONCE
  useEffect(() => {
    // Use this flag to prevent multiple executions
    if (initialLoadStarted) return;
    
    let isMounted = true;
    setInitialLoadStarted(true);
    
    const loadInitialData = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Load everything in sequence
        await loadRoles();
        if (!isMounted) return;
        
        await loadPermissions();
        if (!isMounted) return;
        
        // Now that we have roles and permissions, load role permissions
        if (rolesRef.current.length > 0 && permissionsRef.current.length > 0) {
          await loadAllRolePermissions();
          if (!isMounted) return;
          
          // Now build the matrix
          buildMatrix();
        }
        
        if (isMounted) {
          setInitialLoadComplete(true);
        }
      } catch (err) {
        console.error("Failed initial data load:", err);
        if (isMounted) {
          setError("Failed to load data. Please refresh and try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

  // Update matrix ONLY when rolePermissionsMap changes AND we have data
  useEffect(() => {
    if (initialLoadComplete && roles.length > 0 && permissions.length > 0 && Object.keys(rolePermissionsMap).length > 0) {
      buildMatrix();
    }
  }, [rolePermissionsMap, initialLoadComplete, roles.length, permissions.length, buildMatrix]);

  
  return {
    roles,
    permissions,
    matrix,
    changes,
    isLoading,
    error,
    togglePermission,
    saveChanges,
    refreshData,
    initialLoadComplete
  };
}








































// // usePermissionMatrix.ts
// import { useState, useEffect, useCallback, useRef } from 'react';
// import { useRoleContext } from '@/hooks/roles/roleContext';
// import { usePermissionQueries } from '@/hooks/permission/usePermissionQueries';
// import { usePermissionMutations } from '@/hooks/permission/usePermissionMutations';
// import { toast } from '@/hooks/use-toast';
// import { RoleItemType } from '@/apis/roles/role.api';
// import { PermissionDTO } from '@/common/types/permission';
// import { getPermissionsByRoleApi } from '@/apis/permission/permission.api';

// // Define type for permission change
// interface PermissionChange {
//   roleId: string;
//   permissionId: string;
//   assigned: boolean;
// }

// export function usePermissionMatrix() {
//   // State with TypeScript
//   const [roles, setRoles] = useState<RoleItemType[]>([]);
//   const [permissions, setPermissions] = useState<PermissionDTO[]>([]);
//   const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
//   const [changes, setChanges] = useState<PermissionChange[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, PermissionDTO[]>>({});

//   // Refs to avoid dependency cycles
//   const rolesRef = useRef<RoleItemType[]>([]);
//   const permissionsRef = useRef<PermissionDTO[]>([]);
//   const matrixRef = useRef<Record<string, Record<string, boolean>>>({});
//   const rolePermissionsMapRef = useRef<Record<string, PermissionDTO[]>>({});

//   // Update refs when state changes
//   useEffect(() => {
//     rolesRef.current = roles;
//   }, [roles]);

//   useEffect(() => {
//     permissionsRef.current = permissions;
//   }, [permissions]);

//   useEffect(() => {
//     matrixRef.current = matrix;
//   }, [matrix]);

//   useEffect(() => {
//     rolePermissionsMapRef.current = rolePermissionsMap;
//   }, [rolePermissionsMap]);

//   // Hooks
//   const { getAllRoles } = useRoleContext();
//   const { listPermissions, getPermissionsByRole } = usePermissionQueries();
//   const { assignPermissionsToRoleMutation, removePermissionsFromRoleMutation } = usePermissionMutations();

//   const permissionsQuery = listPermissions({});

//   // Load roles - FIXED: removed roles from dependency array
//   const loadRoles = useCallback(async (): Promise<boolean> => {
//     try {
//       setIsLoading(true);
//       const cachedRoles = localStorage.getItem('matrix_roles');
      
//       if (cachedRoles) {
//         try {
//           const parsed = JSON.parse(cachedRoles);
//           if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
//             // Only update if data is different
//             if (JSON.stringify(parsed.data) !== JSON.stringify(rolesRef.current)) {
//               setRoles(parsed.data);
//             }
//             return true;
//           }
//         } catch (e) {
//           console.warn("Invalid cached roles data", e);
//         }
//       }
      
//       const result = await getAllRoles.refetch();
//       if (result.data) {
//         // Only update if new data is different
//         if (JSON.stringify(result.data) !== JSON.stringify(rolesRef.current)) {
//           setRoles(result.data);
//           localStorage.setItem('matrix_roles', JSON.stringify({
//             data: result.data,
//             timestamp: Date.now()
//           }));
//         }
//       }
//       return true;
//     } catch (err) {
//       console.error("Failed to load roles:", err);
//       setError("Failed to load roles: " + (err instanceof Error ? err.message : String(err)));
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   }, [getAllRoles]); // FIXED: Removed roles dependency
  
//   // Load permissions - FIXED: removed permissions from dependency array
//   const loadPermissions = useCallback(async (): Promise<boolean> => {
//     try {
//       setIsLoading(true);
//       const result = await permissionsQuery.refetch();
      
//       if (result.data?.data) {
//         if (JSON.stringify(result.data.data) !== JSON.stringify(permissionsRef.current)) {
//           setPermissions(result.data.data);
//         }
//         return true;
//       }
//       return false;
//     } catch (err) {
//       console.error("Failed to load permissions:", err);
//       setError("Failed to load permissions");
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   }, [permissionsQuery]); // FIXED: Removed permissions dependency

//   // Load permissions for all roles - COMPLETELY REWORKED
//   const loadAllRolePermissions = useCallback(async () => {
//     const currentRoles = rolesRef.current;
//     if (currentRoles.length === 0) return;

//     setIsLoading(true);
//     const newRolePermissions: Record<string, PermissionDTO[]> = {};
    
//     // Initialize empty permissions for all roles to avoid undefined
//     currentRoles.forEach(role => {
//       newRolePermissions[role.id] = [];
//     });

//     try {
//       // Process roles sequentially to avoid overwhelming the server
//       for (const role of currentRoles) {
//         try {
//           // Direct API call instead of refetch to avoid react-query issues
//           const permissions = await getPermissionsByRoleApi(role.id);
          
//           if (permissions && permissions.data) {
//             newRolePermissions[role.id] = permissions.data;
//           }
//         } catch (err) {
//           console.error(`Failed to load permissions for role ${role.id}:`, err);
//           // Continue with next role instead of failing completely
//         }
//       }

//       setRolePermissionsMap(newRolePermissions);
//     } catch (err) {
//       console.error("Failed to load role permissions:", err);
//       setError("Failed to load role permissions");
//     } finally {
//       setIsLoading(false);
//     }
//   }, []); // No dependencies to avoid re-creation

//   // Get role permissions - FIXED: use ref instead of state with better error handling
//   const loadRolePermissions = useCallback((roleId: string): PermissionDTO[] => {
//     if (!roleId) {
//       console.warn("Attempted to load permissions for undefined role ID");
//       return [];
//     }
    
//     const permissions = rolePermissionsMapRef.current[roleId];
//     if (!permissions) {
//       // This is normal for new roles, so just log at debug level
//       console.debug(`No permissions found for role ${roleId}`);
//       return [];
//     }
    
//     return permissions;
//   }, []);

//   // Build matrix - COMPLETELY REWORKED for reliability
//   const buildMatrix = useCallback(async (): Promise<void> => {
//     const currentRoles = rolesRef.current;
//     const currentPermissions = permissionsRef.current;
    
//     if (currentRoles.length === 0 || currentPermissions.length === 0) {
//       console.debug("Not enough data to build matrix", { 
//         rolesCount: currentRoles.length, 
//         permissionsCount: currentPermissions.length 
//       });
//       return;
//     }

//     setIsLoading(true);
//     const newMatrix: Record<string, Record<string, boolean>> = {};

//     try {
//       // Create a map of permission IDs for faster lookup
//       const permissionIdMap = new Map<string, boolean>();
//       currentPermissions.forEach(permission => {
//         permissionIdMap.set(permission.id, true);
//       });
      
//       // Process each role
//       currentRoles.forEach((role) => {
//         if (!role.id) {
//           console.warn("Found role without ID, skipping", role);
//           return;
//         }
        
//         newMatrix[role.id] = {};
        
//         // Initialize all permissions to false first
//         currentPermissions.forEach(permission => {
//           if (permission.id) {
//             newMatrix[role.id][permission.id] = false;
//           }
//         });
        
//         // Then set true for permissions the role has
//         const rolePermissions = loadRolePermissions(role.id);
        
//         rolePermissions.forEach((permission) => {
//           // Validate the permission exists in our current permissions list
//           if (permission.id && permissionIdMap.has(permission.id)) {
//             newMatrix[role.id][permission.id] = true;
//           }
//         });
//       });

//       setMatrix(newMatrix);
//     } catch (err) {
//       console.error("Failed to build matrix:", err);
//       setError("Failed to build permission matrix");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [loadRolePermissions]);

//   // Toggle permission - FIXED: use ref instead of state
//   const togglePermission = useCallback((roleId: string, permissionId: string): void => {
//     const currentMatrix = matrixRef.current;
//     const currentValue = currentMatrix[roleId]?.[permissionId] || false;
//     const newValue = !currentValue;

//     setMatrix(prev => ({
//       ...prev,
//       [roleId]: {
//         ...prev[roleId],
//         [permissionId]: newValue
//       }
//     }));

//     setChanges(prev => {
//       const filtered = prev.filter(
//         change => !(change.roleId === roleId && change.permissionId === permissionId)
//       );
//       return [...filtered, { roleId, permissionId, assigned: newValue }];
//     });
//   }, []); // FIXED: Removed matrix dependency

//   // Save changes
//   const saveChanges = useCallback(async (): Promise<void> => {
//     if (changes.length === 0) {
//       toast({
//         title: "No changes",
//         description: "No changes to save",
//         variant: "default"
//       });
//       return;
//     }

//     setIsLoading(true);
    
//     // Group by role and action
//     const changesByRole: Record<string, { assign: string[], remove: string[] }> = {};
//     changes.forEach(change => {
//       if (!changesByRole[change.roleId]) {
//         changesByRole[change.roleId] = { assign: [], remove: [] };
//       }
      
//       if (change.assigned) {
//         changesByRole[change.roleId].assign.push(change.permissionId);
//       } else {
//         changesByRole[change.roleId].remove.push(change.permissionId);
//       }
//     });

//     let successCount = 0;
//     let errorCount = 0;

//     try {
//       // Execute changes
//       for (const roleId in changesByRole) {
//         const { assign, remove } = changesByRole[roleId];
        
//         if (assign.length > 0) {
//           try {
//             await assignPermissionsToRoleMutation.mutateAsync({
//               roleId,
//               data: { permissionIds: assign }
//             });
//             successCount++;
//           } catch (err) {
//             console.error(`Failed to assign permissions to role ${roleId}:`, err);
//             errorCount++;
//           }
//         }

//         if (remove.length > 0) {
//           try {
//             await removePermissionsFromRoleMutation.mutateAsync({
//               roleId,
//               data: { permissionIds: remove }
//             });
//             successCount++;
//           } catch (err) {
//             console.error(`Failed to remove permissions from role ${roleId}:`, err);
//             errorCount++;
//           }
//         }
//       }

//       // Show result
//       if (errorCount === 0) {
//         toast({
//           title: "Changes saved",
//           description: `Successfully saved all changes`,
//           variant: "default"
//         });
//       } else {
//         toast({
//           title: "Partial success",
//           description: `Saved some changes but encountered ${errorCount} errors`,
//           variant: "destructive"
//         });
//       }

//       // Clear changes
//       setChanges([]);
      
//       // Reload role permissions and rebuild matrix
//       await loadAllRolePermissions();
//       await buildMatrix();
//     } catch (err) {
//       console.error("Error saving changes:", err);
//       toast({
//         title: "Error",
//         description: "Failed to save changes",
//         variant: "destructive"
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [changes, assignPermissionsToRoleMutation, removePermissionsFromRoleMutation, loadAllRolePermissions, buildMatrix]);

//   // Refresh data - FIXED: Better error handling, sequential loading, and debounce
//   const refreshData = useCallback(async (): Promise<void> => {
//     // Prevent multiple simultaneous refreshes
//     if (isLoading) {
//       toast({
//         title: "Already loading",
//         description: "Please wait for the current operation to complete",
//         variant: "default"
//       });
//       return;
//     }
    
//     setIsLoading(true);
//     setError(null);
    
//     let refreshSuccess = true;
    
//     try {
//       // Step 1: Load roles
//       const rolesSuccess = await loadRoles();
//       if (!rolesSuccess) {
//         refreshSuccess = false;
//         setError("Failed to load roles");
//       }
      
//       // Step 2: Load permissions
//       const permissionsSuccess = await loadPermissions();
//       if (!permissionsSuccess) {
//         refreshSuccess = false;
//         setError(prev => prev ? prev + ", permissions" : "Failed to load permissions");
//       }
      
//       // Only proceed with role permissions if both roles and permissions loaded
//       if (rolesSuccess && permissionsSuccess) {
//         try {
//           // Step 3: Load role permissions
//           await loadAllRolePermissions();
//         } catch (err) {
//           console.error("Error loading role permissions:", err);
//           refreshSuccess = false;
//           setError(prev => prev ? prev + ", role permissions" : "Failed to load role permissions");
//         }
//       }
      
//       // Always try to build the matrix with whatever data we have
//       try {
//         await buildMatrix();
//       } catch (matrixErr) {
//         console.error("Error building matrix:", matrixErr);
//         refreshSuccess = false;
//         setError(prev => prev ? prev + ", matrix build" : "Failed to build matrix");
//       }
      
//       // Show toast based on result
//       if (refreshSuccess) {
//         toast({
//           title: "Data refreshed",
//           description: "Permission matrix has been refreshed",
//           variant: "default"
//         });
//       } else {
//         toast({
//           title: "Partial refresh",
//           description: "Some data could not be refreshed. Please try again.",
//           variant: "default"
//         });
//       }
//     } catch (err) {
//       console.error("Failed to refresh data:", err);
//       setError("Failed to refresh data: " + (err instanceof Error ? err.message : String(err)));
      
//       toast({
//         title: "Refresh failed",
//         description: "Could not refresh permission data. Please try again later.",
//         variant: "destructive"
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [isLoading, loadRoles, loadPermissions, loadAllRolePermissions, buildMatrix]);

//   // Initial data load - FIXED: better sequential loading with error handling
//   useEffect(() => {
//     let isMounted = true;
//     let loadingTimeout: NodeJS.Timeout;

//     const loadInitialData = async () => {
//       if (!isMounted) return;
      
//       setIsLoading(true);
//       setError(null);
      
//       // Safety timeout to prevent UI from being stuck in loading state
//       loadingTimeout = setTimeout(() => {
//         if (isMounted) {
//           setIsLoading(false);
//           setError("Loading timed out. Please try refreshing.");
//         }
//       }, 30000); // 30 second timeout
      
//       try {
//         // Load data sequentially with proper error handling
//         const rolesSuccess = await loadRoles();
//         if (!isMounted) return;
        
//         if (rolesSuccess) {
//           const permissionsSuccess = await loadPermissions();
//           if (!isMounted) return;
          
//           if (permissionsSuccess && rolesRef.current.length > 0 && permissionsRef.current.length > 0) {
//             try {
//               await loadAllRolePermissions();
//               if (isMounted) {
//                 await buildMatrix();
//               }
//             } catch (err) {
//               console.error("Error in permission loading:", err);
//               if (isMounted) {
//                 // Still build matrix with whatever data we have
//                 await buildMatrix();
//               }
//             }
//           }
//         }
//       } catch (err) {
//         console.error("Failed initial data load:", err);
//         if (isMounted) {
//           setError("Failed to load data. Please refresh and try again.");
//         }
//       } finally {
//         clearTimeout(loadingTimeout);
//         if (isMounted) {
//           setIsLoading(false);
//         }
//       }
//     };

//     loadInitialData();
    
//     return () => {
//       isMounted = false;
//       clearTimeout(loadingTimeout);
//     };
//   }, []);
  
//   return {
//     roles,
//     permissions,
//     matrix,
//     changes,
//     isLoading,
//     error,
//     togglePermission,
//     saveChanges,
//     refreshData
//   };
// }