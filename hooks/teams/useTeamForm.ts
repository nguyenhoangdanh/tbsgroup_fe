import { useState, useEffect, useCallback } from 'react';
import { Team, TeamCreateDTO, TeamUpdateDTO, TeamLeader } from '@/common/interface/team';
import { useTeam } from './TeamContext';

interface UseTeamFormProps {
  teamId?: string | null;
  defaultValues?: Partial<TeamCreateDTO | TeamUpdateDTO>;
  onSuccess?: (teamId: string, isNew: boolean) => void;
  onError?: (error: any) => void;
  includeLeaders?: boolean;
}

interface UseTeamFormResult<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  leaders: TeamLeader[];
  isLoading: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
  team: Team | null;
  
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  validateForm: () => boolean;
}

/**
 * Custom hook for working with team forms
 */
export function useTeamForm<T extends TeamCreateDTO | TeamUpdateDTO>({
  teamId,
  defaultValues = {},
  onSuccess,
  onError,
  includeLeaders = true
}: UseTeamFormProps): UseTeamFormResult<T> {
  const { 
    getTeam, 
    getTeamLeaders, 
    createTeam, 
    updateTeam, 
    isCreating,
    isUpdating,
    queries
  } = useTeam();
  
  const [formData, setFormData] = useState<T>({ ...defaultValues } as T);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leaders, setLeaders] = useState<TeamLeader[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if this is an edit form or a create form
  const isEditForm = !!teamId;
  const isSaving = isCreating || isUpdating;
  
  // Load team data if this is an edit form
  useEffect(() => {
    const loadTeamData = async () => {
      if (!teamId) {
        setTeam(null);
        setLeaders([]);
        return;
      }
      
      setIsLoading(true);
      try {
        // Get team details
        const teamData = await getTeam(teamId);
        setTeam(teamData);
        
        if (teamData) {
          // Update form data with team data for edit mode
          if (isEditForm) {
            // For edit form, we only need name and description in TeamUpdateDTO
            setFormData(prev => ({
              ...prev,
              name: teamData.name,
              description: teamData.description || '',
            } as T));
          } else {
            // For create form with initial team data, include all fields
            const createData = {
              ...formData,
              code: teamData.code,
              name: teamData.name,
              description: teamData.description || '',
              lineId: teamData.lineId,
            };
            
            // Type guard to ensure we only set code and lineId for TeamCreateDTO
            if ('code' in formData && 'lineId' in formData) {
              setFormData(prev => createData as T);
            }
          }
          
          // Get leaders if requested
          if (includeLeaders) {
            const leadersData = await getTeamLeaders(teamId);
            setLeaders(leadersData);
          }
        }
      } catch (error) {
        console.error('Error loading team data:', error);
        if (onError) onError(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTeamData();
  }, [teamId, getTeam, getTeamLeaders, includeLeaders, onError, isEditForm, formData]);
  
  // Handle form input changes
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Clear any error associated with this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, [errors]);
  
  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    // Check required fields common to both create and update forms
    if (!formData.name?.trim()) {
      newErrors.name = 'Tên tổ không được để trống';
    }
    
    if (formData.name && formData.name.length < 3) {
      newErrors.name = 'Tên tổ phải có ít nhất 3 ký tự';
    }
    
    // Additional validations for create form
    if (!isEditForm) {
      // Type guard to check if we're working with TeamCreateDTO
      if ('code' in formData && 'lineId' in formData) {
        if (!formData.code?.trim()) {
          newErrors.code = 'Mã tổ không được để trống';
        }
        
        if (formData.code && formData.code.length < 2) {
          newErrors.code = 'Mã tổ phải có ít nhất 2 ký tự';
        }
        
        if (!formData.lineId?.trim()) {
          newErrors.lineId = 'Dây chuyền không được để trống';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isEditForm]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isEditForm && teamId) {
        // Update team
        const updateData: TeamUpdateDTO = {
          name: formData.name,
          description: formData.description
        };
        
        const success = await updateTeam(teamId, updateData);
        
        if (success && onSuccess) {
          onSuccess(teamId, false);
        }
      } else {
        // Make sure we have TeamCreateDTO
        if ('code' in formData && 'lineId' in formData) {
          // Create new team
          const createData: TeamCreateDTO = {
            code: formData.code,
            name: formData.name,
            lineId: formData.lineId,
            description: formData.description
          };
          
          const newTeamId = await createTeam(createData);
          
          if (newTeamId && onSuccess) {
            onSuccess(newTeamId, true);
          }
        } else {
          throw new Error('Missing required fields for team creation');
        }
      }
    } catch (error) {
      console.error('Error saving team:', error);
      if (onError) onError(error);
    }
  }, [formData, teamId, isEditForm, validateForm, updateTeam, createTeam, onSuccess, onError]);
  
  // Reset form to defaults or initial team data
  const resetForm = useCallback(() => {
    if (isEditForm && team) {
      // For edit form, only include fields relevant for update
      setFormData({
        name: team.name,
        description: team.description || '',
      } as T);
    } else if (!isEditForm && team) {
      // For create form with initial team data
      const resetData = {
        code: team.code,
        name: team.name,
        description: team.description || '',
        lineId: team.lineId,
      };
      
      // Type guard to ensure we're working with TeamCreateDTO
      if ('code' in formData && 'lineId' in formData) {
        setFormData(resetData as T);
      }
    } else {
      // Just use default values when no team data available
      setFormData({ ...defaultValues } as T);
    }
    
    setErrors({});
  }, [defaultValues, isEditForm, team, formData]);
  
  return {
    formData,
    setFormData,
    leaders,
    isLoading,
    isSaving,
    errors,
    team,
    
    handleChange,
    handleSubmit,
    resetForm,
    validateForm
  };
}

export default useTeamForm;