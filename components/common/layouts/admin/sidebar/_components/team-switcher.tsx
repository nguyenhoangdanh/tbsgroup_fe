"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
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
import { useSidebarState } from "@/components/common/layouts/admin/AdminLayout"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { CheckIcon, PlusCircleIcon, SortDesc } from "lucide-react"
import { Team } from "./sidebar-data"

// Định nghĩa props cho TeamSwitcher component
interface TeamSwitcherProps {
    teams: Team[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
    const [open, setOpen] = React.useState(false)
    const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
    const [selectedTeam, setSelectedTeam] = React.useState(teams[0])

    const { collapsed } = useSidebarState()
    const isMobileScreen = useMediaQuery("(max-width: 768px)")

    // Không áp dụng chế độ icon trên mobile
    const isIconMode = !isMobileScreen && collapsed

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
                        <Avatar className={cn("mr-2 h-5 w-5", isIconMode && "mr-0")}>
                            <AvatarImage
                                src={`https://avatar.vercel.sh/${selectedTeam.label}.png`}
                                alt={selectedTeam.label}
                            />
                            <AvatarFallback>SC</AvatarFallback>
                        </Avatar>
                        {!isIconMode && (
                            <>
                                <span className="team.label">{selectedTeam.label}</span>
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
                                        <Avatar className="mr-2 h-5 w-5">
                                            <AvatarImage
                                                src={`https://avatar.vercel.sh/${team.label}.png`}
                                                alt={team.label}
                                            />
                                            <AvatarFallback>
                                                {team.label[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
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
                                {/* Wrap the DialogTrigger with Dialog */}
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