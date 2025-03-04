"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BadgeCheck, Bell, ChevronDown, ChevronsUpDown, CircleUserRound, LogOut, SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface IUserAvatarProps {
    name: string;
    email: string;
    avatar?: string;
}

const UserAvatar: React.FC<IUserAvatarProps> = ({ name, email, avatar }) => {
    const router = useRouter();
    return (
        <div className="flex items-center gap-2" >
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs">{email}</span>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 rounded-lg">
                        {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                        <AvatarFallback className="rounded-lg">
                            {name?.split(" ").map((n) => n[0]).join("").toLocaleUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() => router.push("/profile")}
                        >
                            <CircleUserRound size="16px" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Bell size="16px" />
                            Notifications
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <SettingsIcon />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem >
                            <LogOut size="16px" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default UserAvatar;