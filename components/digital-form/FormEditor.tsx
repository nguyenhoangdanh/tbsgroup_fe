'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2, CalendarIcon, Factory, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { toast } from 'react-toast-kit';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDigitalFormQueries } from '@/hooks/digital-form/useDigitalFormQueries';
import { cn } from '@/lib/utils';

// Form schema with validation
const formSchema = z.object({
  formName: z.string().min(3, { message: 'Form name must be at least 3 characters.' }),
  date: z.date({ required_error: 'A date is required.' }),
  factoryId: z.string().min(1, { message: 'Factory is required.' }),
  lineId: z.string().min(1, { message: 'Line is required.' }),
  teamId: z.string().optional(),
  groupId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Factory {
  id: string;
  name: string;
}

interface Line {
  id: string;
  name: string;
  factoryId: string;
}

interface Team {
  id: string;
  name: string;
  lineId: string;
}

interface Group {
  id: string;
  name: string;
  teamId: string;
}

interface FormEditorProps {
  formId?: string; // If provided, we're editing an existing form
  onSuccess?: (formId: string) => void;
  className?: string;
}

export function FormEditor({ formId, onSuccess, className }: FormEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State for filtered options
  const [factories, setFactories] = useState<Factory[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredLines, setFilteredLines] = useState<Line[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);

  const { useDigitalForm, useCreateDigitalForm, useUpdateDigitalForm } = useDigitalFormQueries();

  // Form for creating/editing
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formName: '',
      factoryId: '',
      lineId: '',
      teamId: '',
      groupId: '',
    },
  });

  // If formId is provided, load the existing form
  const { data: formData, isLoading: isLoadingForm } = useDigitalForm(formId || '', {
    enabled: !!formId,
  });

  // Mutations for creating or updating forms
  const createFormMutation = useCreateDigitalForm();
  const updateFormMutation = useUpdateDigitalForm(formId || '');

  // Load factories, lines, teams, and groups from API
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        // This would typically call your API
        // For now, let's use dummy data
        setFactories([
          { id: 'factory-1', name: 'Factory A' },
          { id: 'factory-2', name: 'Factory B' },
        ]);

        setLines([
          { id: 'line-1', name: 'Line 1', factoryId: 'factory-1' },
          { id: 'line-2', name: 'Line 2', factoryId: 'factory-1' },
          { id: 'line-3', name: 'Line 3', factoryId: 'factory-2' },
        ]);

        setTeams([
          { id: 'team-1', name: 'Team A', lineId: 'line-1' },
          { id: 'team-2', name: 'Team B', lineId: 'line-1' },
          { id: 'team-3', name: 'Team C', lineId: 'line-2' },
        ]);

        setGroups([
          { id: 'group-1', name: 'Group 1', teamId: 'team-1' },
          { id: 'group-2', name: 'Group 2', teamId: 'team-1' },
          { id: 'group-3', name: 'Group 3', teamId: 'team-2' },
        ]);
      } catch (error) {
        console.error('Failed to fetch options:', error);
        toast.error('Failed to load form options');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // Load form data if editing
  useEffect(() => {
    if (formData?.data && formId) {
      const form = formData.data;

      // Set form values
      const dateObj = new Date(form.date);
      const formValues: FormValues = {
        formName: form.formName,
        date: dateObj,
        factoryId: form.factoryId,
        lineId: form.lineId,
        teamId: form.teamId || '',
        groupId: form.groupId || '',
      };

      // Reset form with values
      form.reset(formValues);

      // Update filtered values
      updateFilteredOptions(form.factoryId, form.lineId, form.teamId);
    }
  }, [formData, formId, form.reset]);

  // Update filtered options when factory/line/team changes
  const updateFilteredOptions = (factoryId: string, lineId?: string, teamId?: string) => {
    if (factoryId) {
      setFilteredLines(lines.filter(line => line.factoryId === factoryId));

      if (lineId) {
        setFilteredTeams(teams.filter(team => team.lineId === lineId));

        if (teamId) {
          setFilteredGroups(groups.filter(group => group.teamId === teamId));
        } else {
          setFilteredGroups([]);
        }
      } else {
        setFilteredTeams([]);
        setFilteredGroups([]);
      }
    } else {
      setFilteredLines([]);
      setFilteredTeams([]);
      setFilteredGroups([]);
    }
  };

  // Watch for factory/line/team changes to update filtered options
  const watchFactoryId = form.watch('factoryId');
  const watchLineId = form.watch('lineId');
  const watchTeamId = form.watch('teamId');

  useEffect(() => {
    updateFilteredOptions(watchFactoryId, watchLineId, watchTeamId);
  }, [watchFactoryId, watchLineId, watchTeamId]);

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Format the date
      const formattedDate = format(values.date, 'yyyy-MM-dd');

      const payload = {
        ...values,
        date: formattedDate,
      };

      let response;

      if (formId) {
        // Update existing form
        response = await updateFormMutation.mutateAsync(payload);
        toast.success('Form updated successfully');
      } else {
        // Create new form
        response = await createFormMutation.mutateAsync(payload);
        toast.success('Form created successfully');
      }

      // Call onSuccess callback or navigate
      if (onSuccess && response?.data) {
        onSuccess(response.data.id);
      } else if (response?.data) {
        router.push(`/forms/${response.data.id}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(`Failed to ${formId ? 'update' : 'create'} form`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn('max-w-2xl mx-auto', className)}>
      <CardHeader>
        <CardTitle>{formId ? 'Edit Form' : 'Create New Form'}</CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading || isLoadingForm ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Form Name Field */}
              <FormField
                control={form.control}
                name="formName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Daily Production Form" {...field} />
                    </FormControl>
                    <FormDescription>Give this form a descriptive name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Field */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'MMMM d, yyyy')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>The date this form applies to.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Factory Field */}
              <FormField
                control={form.control}
                name="factoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factory</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a factory">
                            {field.value && (
                              <div className="flex items-center">
                                <Factory className="mr-2 h-4 w-4" />
                                <span>
                                  {factories.find(f => f.id === field.value)?.name ||
                                    'Select a factory'}
                                </span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {factories.map(factory => (
                          <SelectItem key={factory.id} value={factory.id}>
                            <div className="flex items-center">
                              <Factory className="mr-2 h-4 w-4" />
                              <span>{factory.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Line Field */}
              <FormField
                control={form.control}
                name="lineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Line</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!watchFactoryId || filteredLines.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a line">
                            {field.value && (
                              <span>
                                {lines.find(l => l.id === field.value)?.name || 'Select a line'}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredLines.map(line => (
                          <SelectItem key={line.id} value={line.id}>
                            {line.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{!watchFactoryId && 'Select a factory first'}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Team Field (Optional) */}
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team (Optional)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!watchLineId || filteredTeams.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team">
                            {field.value && (
                              <div className="flex items-center">
                                <Users className="mr-2 h-4 w-4" />
                                <span>
                                  {teams.find(t => t.id === field.value)?.name || 'Select a team'}
                                </span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {filteredTeams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center">
                              <Users className="mr-2 h-4 w-4" />
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {!watchLineId ? 'Select a line first' : 'Optional: Specify a team'}
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Group Field (Optional) */}
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group (Optional)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!watchTeamId || filteredGroups.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group">
                            {field.value && (
                              <span>
                                {groups.find(g => g.id === field.value)?.name || 'Select a group'}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {filteredGroups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {!watchTeamId ? 'Select a team first' : 'Optional: Specify a group'}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting || isLoading || isLoadingForm}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {formId ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>{formId ? 'Update Form' : 'Create Form'}</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default FormEditor;
