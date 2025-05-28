'use client';

import {
  CheckIcon,
  PlusCircleIcon,
  SortDesc,
  Briefcase,
  Building,
  Users,
  Construction,
  Laptop,
  ShieldCheck,
  Server,
  Layers,
} from 'lucide-react';
import * as React from 'react';

import { Team } from './sidebar-data';
import { useSidebarCollapsed, useSidebarIsMobileView } from '../../SidebarStateProvider';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TeamSwitcherProps {
  teams: Team[];
}

const getTeamIcon = (teamLabel: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    'Acme Inc': <Building size={16} className="text-blue-600 dark:text-blue-400" />,
    'Daily Performance': <Briefcase size={16} className="text-purple-600 dark:text-purple-400" />,
    Development: <Laptop size={16} className="text-green-600 dark:text-green-400" />,
    Engineering: <Construction size={16} className="text-orange-600 dark:text-orange-400" />,
    Operations: <Server size={16} className="text-red-600 dark:text-red-400" />,
    Security: <ShieldCheck size={16} className="text-yellow-600 dark:text-yellow-400" />,
    Management: <Briefcase size={16} className="text-indigo-600 dark:text-indigo-400" />,
    'Human Resources': <Users size={16} className="text-pink-600 dark:text-pink-400" />,
  };

  return iconMap[teamLabel] || <Layers size={16} className="text-slate-600 dark:text-slate-400" />;
};

const TeamIcon = React.memo(({ teamLabel }: { teamLabel: string }) => {
  return <>{getTeamIcon(teamLabel)}</>;
});

TeamIcon.displayName = 'TeamIcon';

const TeamCreateDialog = React.memo(
  ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    const [teamName, setTeamName] = React.useState('');

    const handleSubmit = React.useCallback(() => {
      // Handle team creation logic here
      console.log('Creating team:', teamName);
      setTeamName('');
      onOpenChange(false);
    }, [teamName, onOpenChange]);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Tạo nhóm mới</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Thêm một nhóm mới để quản lý sản phẩm và khách hàng.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-slate-700 dark:text-slate-300">
                Tên nhóm
              </Label>
              <Input
                id="name"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Nhập tên nhóm..."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={!teamName.trim()}>
              Tạo nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

TeamCreateDialog.displayName = 'TeamCreateDialog';

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false);

  const safeTeams = React.useMemo(() => teams || [], [teams]);
  const [selectedTeam, setSelectedTeam] = React.useState(() =>
    safeTeams.length > 0 ? safeTeams[0] : { label: 'Daily Performance', value: 'default' },
  );

  const collapsed = useSidebarCollapsed();
  const isMobileView = useSidebarIsMobileView();

  const isIconMode = React.useMemo(() => {
    return !isMobileView && collapsed;
  }, [isMobileView, collapsed]);

  const handleTeamSelect = React.useCallback(
    (team: Team) => {
      setSelectedTeam(team);
      setOpen(false);
    },
    [setSelectedTeam],
  );

  const handleCreateTeam = React.useCallback(() => {
    setOpen(false);
    setShowNewTeamDialog(true);
  }, []);

  if (!teams || teams.length === 0) {
    return (
      <div className="p-2">
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2',
            isIconMode ? 'justify-center' : '',
          )}
        >
          <TeamIcon teamLabel="Daily Performance" />
          {!isIconMode && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Daily Performance
            </span>
          )}
        </div>
      </div>
    );
  }

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      aria-label="Chọn nhóm"
      className={cn(
        'justify-between border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200',
        isIconMode ? 'w-10 h-10 p-0' : 'w-full h-10 px-3',
      )}
    >
      <div className={cn('flex items-center', isIconMode ? 'justify-center' : 'gap-2')}>
        <TeamIcon teamLabel={selectedTeam.label} />
        {!isIconMode && (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
            {selectedTeam.label}
          </span>
        )}
      </div>
      {!isIconMode && <SortDesc className="ml-auto h-4 w-4 shrink-0 opacity-50" />}
    </Button>
  );

  const popoverContent = (
    <PopoverContent className="w-[250px] p-0 shadow-lg border-slate-200 dark:border-slate-700">
      <Command className="bg-white dark:bg-slate-800">
        <CommandInput 
          placeholder="Tìm kiếm nhóm..." 
          className="border-0 focus:ring-0"
        />
        <CommandList>
          <CommandEmpty className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Không tìm thấy nhóm.
          </CommandEmpty>
          <CommandGroup heading="Nhóm" className="text-slate-600 dark:text-slate-400">
            {teams.map(team => (
              <CommandItem
                key={team.label}
                onSelect={() => handleTeamSelect(team)}
                className={cn(
                  'flex items-center gap-2 px-2 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200',
                  selectedTeam.label === team.label && 'bg-blue-50 dark:bg-blue-900/20',
                )}
              >
                <TeamIcon teamLabel={team.label} />
                <span className="text-slate-700 dark:text-slate-300">{team.label}</span>
                <CheckIcon
                  className={cn(
                    'ml-auto h-4 w-4 text-blue-600 dark:text-blue-400',
                    selectedTeam.label === team.label ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator className="bg-slate-200 dark:bg-slate-700" />
          <CommandGroup>
            <CommandItem
              onSelect={handleCreateTeam}
              className="flex items-center gap-2 px-2 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
            >
              <PlusCircleIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">Tạo nhóm</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  );

  return (
    <div className="p-2">
      <TooltipProvider>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {isIconMode ? (
              <Tooltip>
                <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-900 text-white text-sm">
                  <p>{selectedTeam.label}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              triggerButton
            )}
          </PopoverTrigger>
          {popoverContent}
        </Popover>
      </TooltipProvider>

      <TeamCreateDialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog} />
    </div>
  );
}
