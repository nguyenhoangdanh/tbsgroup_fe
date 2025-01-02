"use client";
import { cn } from "@/lib/utils";
import { Blocks, LucideIcon, MessageSquare } from "lucide-react";
import { useParams, useRouter, usePathname } from "next/navigation";

type NavType = {
    title: string;
    url: string;
    icon: LucideIcon;
};

const SideMenu = () => {
    const { formId } = useParams();
    const router = useRouter();
    const pathname = usePathname();

    const navMenus: NavType[] = [
        {
            title: "Builder",
            url: `/dashboard/form/builder/${formId}`,
            icon: Blocks,
        },
        {
            title: "Responses",
            url: `/dashboard/form/responses/${formId}`,
            icon: MessageSquare,
        },
    ];

    return (
        <div className="fixed h-screen z-40 -ml-1 -mt-1 -mb-1 w-[50px] pt-5 border-r shadow-sm bg-black text-white">
            <ul className="flex flex-col items-center p-0">
                {navMenus.map((item) => (
                    <li key={item.title}
                        className={cn(`outline-none transition-colors ease-in-out p-2 hover:bg-white hover:text-black rounded-md`, {
                            "bg-white text-black": pathname === item.url,
                        })}
                    >
                        <button>
                            <item.icon className="!size-[18px]" />
                            <span className="sr-only">{item.title}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default SideMenu;