'use client';

import React, { memo, useState, useCallback } from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Copy,
  Download,
  FileText,
  Check,
  Ban,
  History,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { BaseTableData, ActionConfig } from '../types/enhanced-types';

interface TableActionsProps<T extends BaseTableData> {
  actions: ActionConfig[];
  record: T;
  position?: 'dropdown' | 'inline' | 'floating';
  maxInlineActions?: number;
  className?: string;
  size?: 'sm' | 'default';
  tooltips?: boolean;
}

export const TableActions = memo(<T extends BaseTableData>({
  actions,
  record,
  position = 'dropdown',
  maxInlineActions = 3,
  className,
  size = 'sm',
  tooltips = true,
}: TableActionsProps<T>) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: ActionConfig | null;
  }>({ open: false, action: null });

  // Filter actions based on conditions
  const availableActions = actions.filter(action => 
    !action.condition || action.condition(record)
  );

  // Handle action click
  const handleActionClick = useCallback(async (action: ActionConfig) => {
    if (action.confirmation) {
      setConfirmDialog({ open: true, action });
      return;
    }

    try {
      await action.onClick?.(record);
    } catch (error) {
      console.error('Action error:', error);
    }
  }, [record]);

  // Handle confirmed action
  const handleConfirmAction = useCallback(async () => {
    if (!confirmDialog.action) return;

    try {
      await confirmDialog.action.onClick?.(record);
    } catch (error) {
      console.error('Confirmed action error:', error);
    } finally {
      setConfirmDialog({ open: false, action: null });
    }
  }, [confirmDialog.action, record]);

  // Get icon for built-in action types
  const getActionIcon = (type: string, iconProps = { className: "h-4 w-4" }) => {
    if (actions.find(a => a.type === type)?.icon) {
      const Icon = actions.find(a => a.type === type)?.icon!;
      return <Icon {...iconProps} />;
    }
    
    switch (type) {
      case 'view': return <Eye {...iconProps} />;
      case 'edit': return <Edit {...iconProps} />;
      case 'delete': return <Trash2 {...iconProps} />;
      case 'copy': return <Copy {...iconProps} />;
      case 'export': return <Download {...iconProps} />;
      case 'approve': return <Check {...iconProps} />;
      case 'reject': return <Ban {...iconProps} />;
      case 'history': return <History {...iconProps} />;
      case 'detail': return <FileText {...iconProps} />;
      default: return null;
    }
  };

  // Get variant for built-in action types
  const getActionVariant = (type: string, customVariant?: string) => {
    if (customVariant) return customVariant;
    
    switch (type) {
      case 'delete':
      case 'reject':
        return 'destructive';
      case 'view':
      case 'detail':
        return 'outline';
      case 'approve':
        return 'default';
      default:
        return 'outline';
    }
  };

  // If no available actions, don't render anything
  if (availableActions.length === 0) {
    return null;
  }

  // Render actions inline
  if (position === 'inline') {
    const inlineActions = availableActions.slice(0, maxInlineActions);
    const dropdownActions = availableActions.slice(maxInlineActions);

    return (
      <>
        <div className={cn("flex items-center gap-1", className)}>
          {/* Primary inline actions */}
          {inlineActions.map((action, index) => {
            const buttonContent = (
              <Button
                key={`${action.type}-${index}`}
                variant={getActionVariant(action.type, action.variant)}
                size={action.size || size}
                onClick={() => handleActionClick(action)}
                className={cn(
                  action.size === 'icon' ? 'w-8 h-8 p-0' : '',
                  action.disabled && 'opacity-50 pointer-events-none'
                )}
                disabled={action.disabled || action.loading}
                title={action.label}
              >
                {action.icon ? 
                  <action.icon className={cn("h-4 w-4", action.size !== 'icon' && "mr-1")} /> : 
                  getActionIcon(action.type)
                }
                {action.size !== 'icon' && action.label}
                {action.loading && (
                  <div className="ml-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
              </Button>
            );
            
            return tooltips ? (
              <TooltipProvider key={`tooltip-${action.type}-${index}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {buttonContent}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : buttonContent;
          })}

          {/* Overflow actions in dropdown */}
          {dropdownActions.length > 0 && (
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size={size} 
                        className={size === 'sm' ? 'h-8 w-8 p-0' : 'w-9 h-9 p-0'}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More actions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {dropdownActions.map((action, index) => (
                  <DropdownMenuItem
                    key={`dropdown-${action.type}-${index}`}
                    onClick={() => handleActionClick(action)}
                    className={cn(
                      action.type === 'delete' && 'text-destructive',
                      action.disabled && 'opacity-50 pointer-events-none'
                    )}
                    disabled={action.disabled || action.loading}
                  >
                    {action.icon ? 
                      <action.icon className="h-4 w-4 mr-2" /> : 
                      getActionIcon(action.type, { className: "h-4 w-4 mr-2" })
                    }
                    <span className="flex-1">{action.label || action.type}</span>
                    {action.loading && (
                      <div className="ml-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Confirmation dialog */}
        <ConfirmationDialog
          open={confirmDialog.open}
          action={confirmDialog.action}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmDialog({ open: false, action: null })}
        />
      </>
    );
  }

  // Dropdown-only mode (default)
  return (
    <>
      <div className={className}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size={size} 
              className={size === 'sm' ? 'h-8 w-8 p-0' : 'w-9 h-9 p-0'}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {availableActions.map((action, index) => (
              <React.Fragment key={`${action.type}-${index}`}>
                <DropdownMenuItem
                  onClick={() => handleActionClick(action)}
                  className={cn(
                    action.type === 'delete' && 'text-destructive',
                    action.disabled && 'opacity-50 pointer-events-none'
                  )}
                  disabled={action.disabled || action.loading}
                >
                  {action.icon ? 
                    <action.icon className="h-4 w-4 mr-2" /> : 
                    getActionIcon(action.type, { className: "h-4 w-4 mr-2" })
                  }
                  <span className="flex-1">{action.label || action.type}</span>
                  {action.loading && (
                    <div className="ml-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                </DropdownMenuItem>
                
                {(action.type === 'view' || action.type === 'edit') && index < availableActions.length - 1 && (
                  <DropdownMenuSeparator />
                )}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        action={confirmDialog.action}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ open: false, action: null })}
      />
    </>
  );
});

// Confirmation dialog component
interface ConfirmationDialogProps {
  open: boolean;
  action: ActionConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog = memo(({
  open,
  action,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) => {
  if (!action?.confirmation) return null;

  const isDestructive = action.type === 'delete' || action.variant === 'destructive';
  
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action.confirmation.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action.confirmation.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {action.confirmation.cancelText || 'Hủy'}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={isDestructive ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {action.confirmation.confirmText || 'Xác nhận'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

TableActions.displayName = 'TableActions';
ConfirmationDialog.displayName = 'ConfirmationDialog';