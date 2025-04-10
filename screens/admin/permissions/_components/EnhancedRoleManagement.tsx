// 'use client';

// import { useState, useMemo, useEffect } from 'react';
// import { useRoleContext } from '@/hooks/roles/roleContext';
// import { RoleItemType } from '@/apis/roles/role.api';
// import { Button } from '@/components/ui/button';
// import {
//     Search,
//     Shield,
//     ChevronRight,
//     Plus,
//     RefreshCw,
//     MoreVertical,
//     Edit,
//     Trash,
//     Copy,
//     AlertTriangle,
//     LayoutGrid,
//     Users,
//     Table
// } from 'lucide-react';
// import { Input } from '@/components/ui/input';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardFooter,
//     CardHeader,
//     CardTitle
// } from '@/components/ui/card';
// import {
//     Tooltip,
//     TooltipContent,
//     TooltipProvider,
//     TooltipTrigger
// } from '@/components/ui/tooltip';
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuGroup,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//     Tabs,
//     TabsContent,
//     TabsList,
//     TabsTrigger
// } from "@/components/ui/tabs";
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Separator } from '@/components/ui/separator';
// import { Badge } from '@/components/ui/badge';
// import { Skeleton } from '@/components/ui/skeleton';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { cn } from '@/lib/utils';
// import useMediaQuery from '@/hooks/useMediaQuery';
// import { RolePermissionsAssignment } from '../RolePermissionsAssignment';
// import BulkPermissionManager from '../BulkRolePermissionManagement';
// import PermissionMatrix from './PermissionMatrix';

// // Import both the old and new components

// export function EnhancedRoleManagement() {
//     const { getAllRoles } = useRoleContext();
//     const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
//     const [searchTerm, setSearchTerm] = useState<string>('');
//     const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
//     const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
//     const [activeView, setActiveView] = useState<'single' | 'bulk' | 'matrix'>('single');
//     const [isMobileView, setIsMobileView] = useState<boolean>(false);
//     const [showPermissions, setShowPermissions] = useState<boolean>(true);
//     const isMobile = useMediaQuery("(max-width: 768px)");

//     // Update mobile view state when media query changes
//     useEffect(() => {
//         setIsMobileView(isMobile);
//         setShowPermissions(!isMobile);
//     }, [isMobile]);

//     // Get all roles data
//     const roleQuery = getAllRoles;

//     const roles = useMemo(() => {
//         if (roleQuery.isSuccess) {
//             return roleQuery.data;
//         }
//         return [];
//     }, [roleQuery.isSuccess, roleQuery.data]);

//     // Filter roles based on search term
//     const filteredRoles = useMemo(() => {
//         if (!searchTerm.trim()) return roles;

//         return roles.filter((role: RoleItemType) =>
//             role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
//             (role.type && role.type.toLowerCase().includes(searchTerm.toLowerCase()))
//         );
//     }, [roles, searchTerm]);

//     // Select the first role by default when roles are loaded
//     useEffect(() => {
//         if (filteredRoles.length > 0 && !selectedRoleId) {
//             setSelectedRoleId(filteredRoles[0].id);
//         }
//     }, [filteredRoles, selectedRoleId]);

//     const handleSelectRole = (roleId: string) => {
//         setSelectedRoleId(roleId);
//         if (isMobileView) {
//             setShowPermissions(true);
//         }
//     };

//     // Function to create a new role
//     const handleCreateRole = () => {
//         // Implement role creation functionality
//         console.log('Create new role');
//         setCreateDialogOpen(false);
//         // After creation, you would typically select the new role
//     };

//     // Function to edit role
//     const handleEditRole = (roleId: string) => {
//         // Implement role editing functionality
//         console.log('Edit role', roleId);
//     };

//     // Function to delete role
//     const handleDeleteRole = (roleId: string) => {
//         // Implement role deletion functionality
//         console.log('Delete role', roleId);
//         setDeleteDialogOpen(false);
//     };

//     // Function to duplicate role
//     const handleDuplicateRole = (roleId: string) => {
//         // Implement role duplication functionality
//         console.log('Duplicate role', roleId);
//     };

//     // Function to refresh roles list
//     const handleRefreshRoles = () => {
//         if (roleQuery.refetch) {
//             roleQuery.refetch();
//         }
//     };

//     // Go back to role list on mobile
//     const handleBackToRoles = () => {
//         setShowPermissions(false);
//     };

//     const selectedRole = roles.find((role: RoleItemType) => role.id === selectedRoleId);

//     // Get view-specific title
//     const getViewTitle = () => {
//         switch (activeView) {
//             case 'bulk':
//                 return 'Bulk Permission Management';
//             case 'matrix':
//                 return 'Permission Matrix View';
//             default:
//                 return 'Role Management';
//         }
//     };

//     // Loading state
//     if (roleQuery.isLoading) {
//         return (
//             <div className="space-y-4 p-6">
//                 <div className="flex justify-between items-center">
//                     <h2 className="text-2xl font-bold">Role Management</h2>
//                     <Skeleton className="h-10 w-32" />
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//                     <div className="md:col-span-1">
//                         <Skeleton className="h-12 w-full mb-4" />
//                         <div className="space-y-2">
//                             {[1, 2, 3, 4].map((i) => (
//                                 <Skeleton key={i} className="h-12 w-full" />
//                             ))}
//                         </div>
//                     </div>
//                     <div className="md:col-span-2">
//                         <Skeleton className="h-[400px] w-full" />
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     // No roles found state
//     if (!roles || roles.length === 0) {
//         return (
//             <Card className="w-full">
//                 <CardHeader>
//                     <CardTitle>Role Management</CardTitle>
//                     <CardDescription>No roles found in the system</CardDescription>
//                 </CardHeader>
//                 <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
//                     <Shield className="h-16 w-16 text-gray-300 mb-4" />
//                     <p className="text-muted-foreground text-center mb-4">There are no roles available. Create your first role to start assigning permissions.</p>
//                     <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
//                         <DialogTrigger asChild>
//                             <Button className="mt-2">
//                                 <Plus className="mr-2 h-4 w-4" />
//                                 Create First Role
//                             </Button>
//                         </DialogTrigger>
//                         <DialogContent>
//                             <DialogHeader>
//                                 <DialogTitle>Create New Role</DialogTitle>
//                                 <DialogDescription>
//                                     Add a new role to the system with a name and description.
//                                 </DialogDescription>
//                             </DialogHeader>
//                             {/* Form content for creating a new role would go here */}
//                             <div className="space-y-4 py-4">
//                                 <div className="space-y-2">
//                                     <label htmlFor="name" className="text-sm font-medium">Role Name</label>
//                                     <Input id="name" placeholder="Enter role name" />
//                                 </div>
//                                 <div className="space-y-2">
//                                     <label htmlFor="description" className="text-sm font-medium">Description</label>
//                                     <Input id="description" placeholder="Enter role description" />
//                                 </div>
//                             </div>
//                             <DialogFooter>
//                                 <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
//                                 <Button onClick={handleCreateRole}>Create Role</Button>
//                             </DialogFooter>
//                         </DialogContent>
//                     </Dialog>
//                 </CardContent>
//             </Card>
//         );
//     }

//     return (
//         <div className="space-y-6">
//             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
//                 <div>
//                     <h1 className="text-2xl font-bold tracking-tight">{getViewTitle()}</h1>
//                     <p className="text-muted-foreground">Manage roles and their permissions in the system</p>
//                 </div>
//                 <div className="flex gap-2">
//                     <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'single' | 'bulk' | 'matrix')}>
//                         <TabsList className="grid grid-cols-3">
//                             <TabsTrigger value="single">
//                                 <Users className="h-4 w-4 mr-2" />
//                                 <span className="hidden sm:inline">Single Role</span>
//                             </TabsTrigger>
//                             <TabsTrigger value="bulk">
//                                 <LayoutGrid className="h-4 w-4 mr-2" />
//                                 <span className="hidden sm:inline">Bulk Mode</span>
//                             </TabsTrigger>
//                             <TabsTrigger value="matrix">
//                                 <Table className="h-4 w-4 mr-2" />
//                                 <span className="hidden sm:inline">Matrix</span>
//                             </TabsTrigger>
//                         </TabsList>
//                     </Tabs>

//                     <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
//                         <DialogTrigger asChild>
//                             <Button className="sm:self-end">
//                                 <Plus className="mr-2 h-4 w-4" />
//                                 <span className="hidden sm:inline">Create Role</span>
//                             </Button>
//                         </DialogTrigger>
//                         <DialogContent>
//                             <DialogHeader>
//                                 <DialogTitle>Create New Role</DialogTitle>
//                                 <DialogDescription>
//                                     Add a new role to the system with a name and description.
//                                 </DialogDescription>
//                             </DialogHeader>
//                             {/* Form content for creating a new role would go here */}
//                             <div className="space-y-4 py-4">
//                                 <div className="space-y-2">
//                                     <label htmlFor="name" className="text-sm font-medium">Role Name</label>
//                                     <Input id="name" placeholder="Enter role name" />
//                                 </div>
//                                 <div className="space-y-2">
//                                     <label htmlFor="description" className="text-sm font-medium">Description</label>
//                                     <Input id="description" placeholder="Enter role description" />
//                                 </div>
//                             </div>
//                             <DialogFooter>
//                                 <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
//                                 <Button onClick={handleCreateRole}>Create Role</Button>
//                             </DialogFooter>
//                         </DialogContent>
//                     </Dialog>
//                 </div>
//             </div>

//             {/* Different views based on activeView */}
//             {activeView === 'single' && (
//                 <div className={cn(
//                     "grid gap-8",
//                     isMobileView
//                         ? "grid-cols-1"
//                         : "grid-cols-1 md:grid-cols-3"
//                 )}>
//                     {/* Left sidebar with roles list - conditionally shown on mobile */}
//                     {(!isMobileView || !showPermissions) && (
//                         <div className={cn(
//                             "space-y-4",
//                             !isMobileView && "md:col-span-1"
//                         )}>
//                             <Card>
//                                 <CardHeader className="pb-3">
//                                     <CardTitle className="text-lg">Available Roles</CardTitle>
//                                     <CardDescription>Select a role to manage its permissions</CardDescription>
//                                     <div className="relative mt-2">
//                                         <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//                                         <Input
//                                             placeholder="Search roles..."
//                                             className="pl-8"
//                                             value={searchTerm}
//                                             onChange={(e) => setSearchTerm(e.target.value)}
//                                         />
//                                     </div>
//                                 </CardHeader>
//                                 <CardContent className="p-0">
//                                     <ScrollArea className="max-h-[420px]">
//                                         {filteredRoles.length === 0 ? (
//                                             <div className="px-4 py-6 text-center text-muted-foreground">
//                                                 No roles match your search
//                                             </div>
//                                         ) : (
//                                             <ul className="divide-y">
//                                                 {filteredRoles.map((role: RoleItemType) => (
//                                                     <li key={role.id}>
//                                                         <div className="flex items-center">
//                                                             <Button
//                                                                 variant={selectedRoleId === role.id ? "secondary" : "ghost"}
//                                                                 className={`flex-grow justify-between rounded-none text-left px-4 py-3 h-auto ${selectedRoleId === role.id ? 'bg-secondary' : ''}`}
//                                                                 onClick={() => handleSelectRole(role.id)}
//                                                             >
//                                                                 <div className="flex items-center">
//                                                                     <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
//                                                                     <div>
//                                                                         <p className="font-medium">{role.name}</p>
//                                                                         {role.description && (
//                                                                             <p className="text-xs text-muted-foreground truncate max-w-[180px]">
//                                                                                 {role.description}
//                                                                             </p>
//                                                                         )}
//                                                                     </div>
//                                                                 </div>
//                                                                 {selectedRoleId === role.id && (
//                                                                     <ChevronRight className="h-4 w-4" />
//                                                                 )}
//                                                             </Button>
//                                                             <DropdownMenu>
//                                                                 <DropdownMenuTrigger asChild>
//                                                                     <Button
//                                                                         variant="ghost"
//                                                                         size="icon"
//                                                                         className="h-full rounded-none"
//                                                                     >
//                                                                         <MoreVertical className="h-4 w-4" />
//                                                                     </Button>
//                                                                 </DropdownMenuTrigger>
//                                                                 <DropdownMenuContent align="end" className="w-56">
//                                                                     <DropdownMenuLabel>Role Actions</DropdownMenuLabel>
//                                                                     <DropdownMenuSeparator />
//                                                                     <DropdownMenuGroup>
//                                                                         <DropdownMenuItem onClick={() => handleEditRole(role.id)}>
//                                                                             <Edit className="mr-2 h-4 w-4" />
//                                                                             Edit Role
//                                                                         </DropdownMenuItem>
//                                                                         <DropdownMenuItem onClick={() => handleDuplicateRole(role.id)}>
//                                                                             <Copy className="mr-2 h-4 w-4" />
//                                                                             Duplicate Role
//                                                                         </DropdownMenuItem>
//                                                                         <DropdownMenuSeparator />
//                                                                         <Dialog>
//                                                                             <DialogTrigger asChild>
//                                                                                 <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
//                                                                                     <Trash className="mr-2 h-4 w-4" />
//                                                                                     Delete Role
//                                                                                 </DropdownMenuItem>
//                                                                             </DialogTrigger>
//                                                                             <DialogContent>
//                                                                                 <DialogHeader>
//                                                                                     <DialogTitle>Delete Role</DialogTitle>
//                                                                                     <DialogDescription>
//                                                                                         Are you sure you want to delete the role "{role.name}"? This action cannot be undone.
//                                                                                     </DialogDescription>
//                                                                                 </DialogHeader>
//                                                                                 <div className="py-2">
//                                                                                     <Alert variant="destructive">
//                                                                                         <AlertTriangle className="h-4 w-4" />
//                                                                                         <AlertDescription>
//                                                                                             All users assigned to this role will lose associated permissions immediately.
//                                                                                         </AlertDescription>
//                                                                                     </Alert>
//                                                                                 </div>
//                                                                                 <DialogFooter className="gap-2 sm:gap-0">
//                                                                                     <Button variant="outline">Cancel</Button>
//                                                                                     <Button
//                                                                                         variant="destructive"
//                                                                                         onClick={() => handleDeleteRole(role.id)}
//                                                                                     >
//                                                                                         Delete Role
//                                                                                     </Button>
//                                                                                 </DialogFooter>
//                                                                             </DialogContent>
//                                                                         </Dialog>
//                                                                     </DropdownMenuGroup>
//                                                                 </DropdownMenuContent>
//                                                             </DropdownMenu>
//                                                         </div>
//                                                     </li>
//                                                 ))}
//                                             </ul>
//                                         )}
//                                     </ScrollArea>
//                                 </CardContent>
//                                 <CardFooter className="p-3 border-t bg-muted/50">
//                                     <div className="flex justify-between items-center w-full">
//                                         <span className="text-sm text-muted-foreground">
//                                             {filteredRoles.length} {filteredRoles.length === 1 ? 'role' : 'roles'}
//                                         </span>
//                                         <TooltipProvider>
//                                             <Tooltip>
//                                                 <TooltipTrigger asChild>
//                                                     <Button
//                                                         variant="ghost"
//                                                         size="icon"
//                                                         onClick={handleRefreshRoles}
//                                                         disabled={roleQuery.isRefetching}
//                                                     >
//                                                         <RefreshCw className={`h-4 w-4 ${roleQuery.isRefetching ? 'animate-spin' : ''}`} />
//                                                     </Button>
//                                                 </TooltipTrigger>
//                                                 <TooltipContent>
//                                                     <p>Refresh roles</p>
//                                                 </TooltipContent>
//                                             </Tooltip>
//                                         </TooltipProvider>
//                                     </div>
//                                 </CardFooter>
//                             </Card>
//                         </div>
//                     )}

//                     {/* Right side with permission management - conditionally shown on mobile */}
//                     {(!isMobileView || showPermissions) && (
//                         <div className={cn(
//                             "space-y-4",
//                             !isMobileView && "md:col-span-2"
//                         )}>
//                             {selectedRoleId ? (
//                                 <Card>
//                                     <CardHeader className="pb-3">
//                                         <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
//                                             {isMobileView && (
//                                                 <Button
//                                                     variant="ghost"
//                                                     onClick={handleBackToRoles}
//                                                     className="mb-2 -ml-2 sm:hidden"
//                                                     size="sm"
//                                                 >
//                                                     <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
//                                                     Back to Roles
//                                                 </Button>
//                                             )}
//                                             <div>
//                                                 <CardTitle className="text-xl flex flex-wrap items-center gap-2">
//                                                     {selectedRole?.name}
//                                                     <Badge variant="outline">
//                                                         {selectedRole?.type || 'Custom Role'}
//                                                     </Badge>
//                                                 </CardTitle>
//                                                 {selectedRole?.description && (
//                                                     <CardDescription className="mt-1">
//                                                         {selectedRole.description}
//                                                     </CardDescription>
//                                                 )}
//                                             </div>
//                                             <div className="flex gap-2 mt-2 sm:mt-0">
//                                                 <Button
//                                                     variant="outline"
//                                                     size="sm"
//                                                     onClick={() => handleEditRole(selectedRoleId)}
//                                                 >
//                                                     <Edit className="mr-2 h-4 w-4" />
//                                                     Edit Role
//                                                 </Button>
//                                                 <DropdownMenu>
//                                                     <DropdownMenuTrigger asChild>
//                                                         <Button variant="outline" size="sm">
//                                                             <MoreVertical className="h-4 w-4" />
//                                                         </Button>
//                                                     </DropdownMenuTrigger>
//                                                     <DropdownMenuContent align="end">
//                                                         <DropdownMenuItem onClick={() => handleDuplicateRole(selectedRoleId)}>
//                                                             <Copy className="mr-2 h-4 w-4" />
//                                                             Duplicate Role
//                                                         </DropdownMenuItem>
//                                                         <DropdownMenuSeparator />
//                                                         <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//                                                             <DialogTrigger asChild>
//                                                                 <DropdownMenuItem
//                                                                     className="text-destructive"
//                                                                     onSelect={(e) => e.preventDefault()}
//                                                                 >
//                                                                     <Trash className="mr-2 h-4 w-4" />
//                                                                     Delete Role
//                                                                 </DropdownMenuItem>
//                                                             </DialogTrigger>
//                                                             <DialogContent>
//                                                                 <DialogHeader>
//                                                                     <DialogTitle>Delete Role</DialogTitle>
//                                                                     <DialogDescription>
//                                                                         Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone.
//                                                                     </DialogDescription>
//                                                                 </DialogHeader>
//                                                                 <div className="py-2">
//                                                                     <Alert variant="destructive">
//                                                                         <AlertTriangle className="h-4 w-4" />
//                                                                         <AlertDescription>
//                                                                             All users assigned to this role will lose associated permissions immediately.
//                                                                         </AlertDescription>
//                                                                     </Alert>
//                                                                 </div>
//                                                                 <DialogFooter>
//                                                                     <Button
//                                                                         variant="outline"
//                                                                         onClick={() => setDeleteDialogOpen(false)}
//                                                                     >
//                                                                         Cancel
//                                                                     </Button>
//                                                                     <Button
//                                                                         variant="destructive"
//                                                                         onClick={() => handleDeleteRole(selectedRoleId)}
//                                                                     >
//                                                                         Delete Role
//                                                                     </Button>
//                                                                 </DialogFooter>
//                                                             </DialogContent>
//                                                         </Dialog>
//                                                     </DropdownMenuContent>
//                                                 </DropdownMenu>
//                                             </div>
//                                         </div>
//                                     </CardHeader>
//                                     <Separator />
//                                     <CardContent className="pt-6">
//                                         <RolePermissionsAssignment roleId={selectedRoleId} />
//                                     </CardContent>
//                                 </Card>
//                             ) : (
//                                 <Card>
//                                     <CardContent className="flex flex-col items-center justify-center pt-12 pb-12">
//                                         <Shield className="h-16 w-16 text-gray-300 mb-4" />
//                                         <p className="text-muted-foreground">Select a role to manage its permissions</p>
//                                         {isMobileView && (
//                                             <Button
//                                                 variant="outline"
//                                                 onClick={handleBackToRoles}
//                                                 className="mt-4"
//                                             >
//                                                 <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
//                                                 View Roles List
//                                             </Button>
//                                         )}
//                                     </CardContent>
//                                 </Card>
//                             )}
//                         </div>
//                     )}
//                 </div>
//             )}

//             {/* Bulk Permissions Management */}
//             {activeView === 'bulk' && (
//                 <div>
//                     <BulkPermissionManager />
//                 </div>
//             )}

//             {/* Matrix View */}
//             {activeView === 'matrix' && (
//                 <div>
//                     <PermissionMatrix />
//                 </div>
//             )}
//         </div>
//     );
// }

// export default EnhancedRoleManagement;