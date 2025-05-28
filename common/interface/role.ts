
export interface RoleType {
    id: string;
    code: string;
    name: string;
    description?: string;
    level: number;
    isSystem: boolean;
    createdAt: string;
    updatedAt?: string;
    permissions?: string[];
    isDefault?: boolean;
    isActive?: boolean;
}