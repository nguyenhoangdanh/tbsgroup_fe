'use client';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-toast-kit';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePermissionContext } from '@/hooks/permission/PermissionContext';
import { useRoleContext } from '@/hooks/roles/roleContext';

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
}

// Predefined templates - in a real app, these would be stored in a database
const predefinedTemplates: PermissionTemplate[] = [
  {
    id: 'basic-user',
    name: 'Basic User',
    description: 'Basic read-only access to common pages',
    permissionIds: [], // In a real app, this would contain actual permission IDs
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Full access to team management features',
    permissionIds: [], // In a real app, this would contain actual permission IDs
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access including user management',
    permissionIds: [], // In a real app, this would contain actual permission IDs
  },
];

export default function QuickAssignmentTemplates() {
  const { getAllRoles } = useRoleContext();
  const { assignPermissionsToRole } = usePermissionContext();

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    description: string;
  }>({ name: '', description: '' });

  const { data: roles, isLoading: isLoadingRoles } = getAllRoles;

  const handleApplyTemplate = async () => {
    if (!selectedRoleId || !selectedTemplateId) {
      toast({
        title: 'Missing selection',
        description: 'Please select both a role and a template',
        variant: 'error',
      });
      return;
    }

    setIsApplying(true);

    try {
      const template = predefinedTemplates.find(t => t.id === selectedTemplateId);

      if (template && template.permissionIds.length > 0) {
        const success = await assignPermissionsToRole(selectedRoleId, template.permissionIds);

        if (success) {
          toast({
            title: 'Template applied',
            description: `Successfully applied "${template.name}" template to the selected role`,
          });
        } else {
          throw new Error('Failed to apply template');
        }
      } else {
        toast({
          title: 'Empty template',
          description: 'The selected template does not contain any permissions',
          variant: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply template',
        variant: 'error',
      });
      console.error('Template application error:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCreateTemplate = () => {
    // In a real app, this would save the template to your backend
    toast({
      title: 'Template created',
      description: 'Your new template has been saved',
    });
    setShowCreateDialog(false);
    setNewTemplate({ name: '', description: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Quick Assignment Templates</span>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Permission Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template of permissions that can be quickly applied to roles.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="E.g., Basic User, Manager, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={newTemplate.description}
                    onChange={e =>
                      setNewTemplate({
                        ...newTemplate,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe what this template grants access to"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Template Permissions</p>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-center text-sm text-muted-foreground">
                      Permission selection UI would go here
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>Create Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-select">Select Role</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              disabled={isLoadingRoles}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-select">Permission Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger id="template-select">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {predefinedTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplateId && (
              <p className="text-sm text-muted-foreground mt-1">
                {predefinedTemplates.find(t => t.id === selectedTemplateId)?.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleApplyTemplate}
          disabled={!selectedRoleId || !selectedTemplateId || isApplying}
        >
          {isApplying ? 'Applying...' : 'Apply Template'}
        </Button>
      </CardFooter>
    </Card>
  );
}
