"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useMediaQuery } from "@/hooks/useMediaQuery"
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
    Layers
} from "lucide-react"
import { Team } from "./sidebar-data"
import { useSidebarState } from "../../SidebarStateProvider"

// Định nghĩa props cho TeamSwitcher component
interface TeamSwitcherProps {
    teams: Team[]
}

// Function để map tên team đến Lucide icon tương ứng
const getTeamIcon = (teamLabel: string) => {
    // Map team labels to appropriate icons based on name
    const iconMap: Record<string, React.ReactNode> = {
        "Acme Inc": <Building size={16} />,
        "Development": <Laptop size={16} />,
        "Engineering": <Construction size={16} />,
        "Operations": <Server size={16} />,
        "Security": <ShieldCheck size={16} />,
        "Management": <Briefcase size={16} />,
        "Human Resources": <Users size={16} />
    };

    // Return mapped icon or default icon
    return (iconMap[teamLabel] as React.ReactNode) || <Layers size={16} />;
};


export function TeamSwitcher({ teams }: TeamSwitcherProps) {
    const [open, setOpen] = React.useState(false)
    const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)

    // Add a default empty array if teams is undefined and use optional chaining
    const safeTeams = teams || []
    const [selectedTeam, setSelectedTeam] = React.useState(safeTeams.length > 0 ? safeTeams[0] : { label: "Default Team", value: "default" })

    const { collapsed } = useSidebarState()
    const isMobileScreen = useMediaQuery("(max-width: 768px)")

    // Không áp dụng chế độ icon trên mobile
    const isIconMode = !isMobileScreen && collapsed

    // Return early if no teams are provided
    if (!teams || teams.length === 0) {
        return null // Or you could render a placeholder message or empty state component
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-label="Select a team"
                        className={`justify-between ${isIconMode ? "w-12 px-0" : "w-[200px]"}`}
                    >
                        <div className={cn("mr-2 flex items-center justify-center h-5 w-5", isIconMode && "mr-0")}>
                            {getTeamIcon(selectedTeam.label)}
                        </div>
                        {!isIconMode && (
                            <>
                                <span>{selectedTeam.label}</span>
                                <SortDesc className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                            </>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandList>
                            <CommandInput placeholder="Search team..." />
                            <CommandEmpty>No team found.</CommandEmpty>
                            <CommandGroup heading="Teams">
                                {teams.map((team) => (
                                    <CommandItem
                                        key={team.label}
                                        onSelect={() => {
                                            setSelectedTeam(team)
                                            setOpen(false)
                                        }}
                                        className="text-sm"
                                    >
                                        <div className="mr-2 flex items-center justify-center h-5 w-5">
                                            {getTeamIcon(team.label)}
                                        </div>
                                        {team.label}
                                        <CheckIcon
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                selectedTeam.label === team.label
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        <CommandSeparator />
                        <CommandList>
                            <CommandGroup>
                                <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
                                    <DialogTrigger asChild>
                                        <CommandItem
                                            onSelect={() => {
                                                setOpen(false)
                                                setShowNewTeamDialog(true)
                                            }}
                                        >
                                            <PlusCircleIcon className="mr-2 h-5 w-5" />
                                            Create Team
                                        </CommandItem>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create team</DialogTitle>
                                            <DialogDescription>
                                                Add a new team to manage products and customers.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div>
                                            <div className="space-y-4 py-2 pb-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Team name</Label>
                                                    <Input id="name" placeholder="Acme Inc." />
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit">Continue</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    )
}