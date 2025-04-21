// import React from "react";
// import { useUserContext } from "@/hooks/users/userContext";
// import { useRoleContext } from "@/hooks/roles/roleContext";
// import { FieldSelect } from "@/components/common/Form/FieldSelect";
// import { FieldInput } from "@/components/common/Form/FieldInput";
// import { Button } from "@/components/ui/button";
// import { UserStatusEnum } from "@/common/enum";

// const UserFilters = () => {
//     const { filterValues, updateFilter, resetFilters } = useUserContext();
//     const { getAllRoles } = useRoleContext();

//     // Get role data for dropdown
//     const roleQuery = getAllRoles;

//     // Status options for filtering
//     const statusOptions = [
//         { value: UserStatusEnum.ACTIVE, label: "Hoạt động" },
//         { value: UserStatusEnum.INACTIVE, label: "Không hoạt động" },
//         { value: UserStatusEnum.PENDING_ACTIVATION, label: "Chờ duyệt" }
//     ];

//     // Prepare role options for dropdown
//     const roleOptions = React.useMemo(() => {
//         if (!roleQuery.data) return [];

//         return [
//             { value: "", label: "Tất cả vai trò" },
//             ...roleQuery.data.map(role => ({
//                 value: role.id,
//                 label: role.name
//             }))
//         ];
//     }, [roleQuery.data]);

//     return (
//         <div className="bg-slate-50 p-4 rounded-md mb-4">
//             <h3 className="text-lg font-medium mb-3">Bộ lọc</h3>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <FieldInput
//                     name="username"
//                     label="Tên đăng nhập"
//                     placeholder="Nhập tên đăng nhập..."
//                     value={filterValues.username}
//                     onChange={(e) => updateFilter('username', e.target.value)}
//                 />

//                 <FieldInput
//                     name="fullName"
//                     label="Họ tên"
//                     placeholder="Nhập họ tên..."
//                     value={filterValues.fullName}
//                     onChange={(e) => updateFilter('fullName', e.target.value)}
//                 />

//                 <FieldSelect
//                     name="role"
//                     label="Vai trò"
//                     options={roleOptions}
//                     value={filterValues.role || ""}
//                     onChange={(value) => updateFilter('role', value)}
//                 />

//                 <FieldSelect
//                     name="status"
//                     label="Trạng thái"
//                     options={statusOptions}
//                     value={filterValues.status || ""}
//                     onChange={(value) => updateFilter('status', value)}
//                 />
//             </div>

//             <div className="mt-4 flex justify-end">
//                 <Button
//                     variant="outline"
//                     onClick={resetFilters}
//                     className="mr-2"
//                 >
//                     Đặt lại
//                 </Button>
//             </div>
//         </div>
//     );
// };