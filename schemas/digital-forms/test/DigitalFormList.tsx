"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    Calendar,
    ChevronLeft,
    Filter,
    Plus,
    Search,
    User,
    CheckCircle,
    XCircle,
    ArrowLeft,
    FileText,
    Edit,
    Trash2
} from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "@/hooks/use-toast"
import { useDigitalFormContext } from "@/hooks/digital-form/DigitalFormContext"
import CreateFormModal from "./CreateFormModal"
import { RecordStatus, DigitalForm, ShiftType } from "@/common/types/digital-form"
import FormEntryModal from "./FormEntryModal"
import { TDigitalFormCreate, TDigitalFormEntry } from "@/schemas/digital-form.schema"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useDigitalForms } from "@/hooks/digital-form/useDigitalForms"
import { Input } from "@/components/ui/input"
import { useGroupQueries } from "@/hooks/group/useGroupQueries"

// Employee Card Component
const EmployeeCard = ({
    employee,
    hasFormToday,
    onSelect
}: {
    employee: any;
    hasFormToday: boolean;
    onSelect: () => void;
}) => {
    return (
        <Card
            className="cursor-pointer hover:border-blue-500 transition-all mb-4"
            onClick={onSelect}
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">{employee.fullName}</h3>
                            <p className="text-sm text-gray-500">{employee.employeeCode}</p>
                        </div>
                    </div>
                    {hasFormToday ? (
                        <Badge className="bg-green-100 text-green-800 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Đã báo cáo
                        </Badge>
                    ) : (
                        <Badge className="bg-red-100 text-red-800 flex items-center">
                            <XCircle className="h-3 w-3 mr-1" />
                            Chưa báo cáo
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// Form Card Component
const FormCard = ({
    form,
    onView,
    onEdit,
    onDelete
}: {
    form: DigitalForm;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) => {
    // Helper to get status styles
    const getStatusStyles = (status: RecordStatus) => {
        switch (status) {
            case RecordStatus.DRAFT:
                return "bg-blue-100 text-blue-800";
            case RecordStatus.PENDING:
                return "bg-yellow-100 text-yellow-800";
            case RecordStatus.CONFIRMED:
                return "bg-green-100 text-green-800";
            case RecordStatus.REJECTED:
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Helper to get shift label
    const getShiftLabel = (shift: ShiftType) => {
        switch (shift) {
            case ShiftType.REGULAR:
                return "Ca Chính";
            case ShiftType.EXTENDED:
                return "Ca Kéo Dài";
            case ShiftType.OVERTIME:
                return "Ca Tăng Ca";
            default:
                return shift;
        }
    };

    return (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <h3 className="font-medium text-gray-900">{form.formName}</h3>
                        <Badge className="ml-2">{form.formCode}</Badge>
                    </div>
                    <Badge className={`${getStatusStyles(form.status)}`}>
                        {form.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-3 text-sm text-gray-500">
                    <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{format(new Date(form.date), "dd/MM/yyyy")}</span>
                    </div>
                    <div>Ca: {getShiftLabel(form.shiftType)}</div>
                    <div>Ngày tạo: {format(new Date(form.createdAt), "dd/MM/yyyy")}</div>
                </div>

                <div className="flex justify-end space-x-2 mt-3">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onView}
                    >
                        <FileText className="h-4 w-4 mr-1" />
                        Xem
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onEdit}
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Sửa
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Xóa
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa phiếu công đoạn này? Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={onDelete}
                                >
                                    Xóa
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    )
}

const DigitalFormList: React.FC<{ groupId: string }> = ({ groupId }) => {
    const router = useRouter();

    // State
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
    const [isEntryModalVisible, setIsEntryModalVisible] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
    const [selectedForm, setSelectedForm] = useState<DigitalForm | null>(null)
    const [selectedEntry, setSelectedEntry] = useState<any>(null)

    // Get context methods
    const {
        filters,
        updateFilter,
        fetchForms,
        createForm,
        deleteForm,
        viewForm,
        isLoadingAny,
        getStatusLabel,
        getStatusColor,
        getShiftLabel,
        addFormEntry,
        deleteFormEntry
    } = useDigitalFormContext();


    const { getGroupById } = useGroupQueries();

    console.log('groupId', groupId);
    const { data: group } = getGroupById(groupId);;

    console.log('group', group)

    // Get forms from context
    const { listForms } = useDigitalForms()
    const { data: formsData, isLoading } = listForms(filters)

    const employees = useMemo(() => {
        return group?.users
            ?.filter(user => user.status === 'ACTIVE')
            ?.map((user) => ({
                username: user.username,
                fullName: user.fullName,
                employeeId: user.employeeId,
            }))
            ?.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [group]);



    // Filter employees by search term
    const filteredEmployees = useMemo(() => {
        if (!searchTerm.trim()) return employees;

        const term = searchTerm.toLowerCase()
        return employees.filter(emp =>
            emp.fullName.toLowerCase().includes(term) ||
            emp.employeeId?.toLocaleLowerCase().includes(term)
            // emp.employeeCode.toLowerCase().includes(term) ||
            // emp.department.toLowerCase().includes(term)
        )
    }, [employees, searchTerm])

    // Update date filter when date changes
    useEffect(() => {
        if (selectedDate) {
            const formattedDate = format(selectedDate, "yyyy-MM-dd")
            updateFilter("dateFrom", new Date(formattedDate))
            updateFilter("dateTo", new Date(formattedDate))
        }
    }, [selectedDate, updateFilter])

    // Check if employee has forms today
    const hasFormToday = useCallback((employeeId: string): boolean => {
        if (!formsData?.data) return false

        return formsData.data.some(form =>
            form.createdById === employeeId &&
            format(new Date(form.date), 'yyyy-MM-dd') === format(selectedDate || new Date(), 'yyyy-MM-dd')
        )
    }, [formsData, selectedDate])

    // Get employee forms for today
    const getTodayForms = useCallback((employeeId: string): DigitalForm[] => {
        if (!formsData?.data) return []

        return formsData.data.filter(form =>
            form.createdById === employeeId &&
            format(new Date(form.date), 'yyyy-MM-dd') === format(selectedDate || new Date(), 'yyyy-MM-dd')
        )
    }, [formsData, selectedDate])

    // Handle employee selection
    const handleSelectEmployee = useCallback((employee: any) => {
        setSelectedEmployee(employee)
        setViewMode('detail')
        updateFilter("createdById", employee.id)
    }, [updateFilter])

    // Handle back to list view
    const handleBackToList = useCallback(() => {
        setSelectedEmployee(null)
        setViewMode('list')
        updateFilter("createdById", undefined)
    }, [updateFilter])

    // Handle create form
    const handleCreateForm = useCallback(async (formData: TDigitalFormCreate) => {
        try {
            const result = await createForm(formData)
            setIsCreateModalVisible(false)
            if (result?.data?.id) {
                toast({
                    title: "Thành công",
                    description: "Đã tạo phiếu mới thành công",
                })
                viewForm(result.data.id)
            }
            return true
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tạo phiếu.",
                variant: "destructive"
            })
            return false
        }
    }, [createForm, viewForm])

    // Handle delete form
    const handleDeleteForm = useCallback(async (id: string) => {
        try {
            await deleteForm(id)
            toast({
                title: "Thành công",
                description: "Đã xóa phiếu."
            })
            fetchForms()
            return true
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể xóa phiếu.",
                variant: "destructive"
            })
            return false
        }
    }, [deleteForm, fetchForms])

    // Handle view form
    const handleViewForm = useCallback((form: DigitalForm) => {
        router.push(`/digital-forms/${form.id}`)
    }, [router])

    // Handle edit form
    const handleEditForm = useCallback((form: DigitalForm) => {
        router.push(`/digital-forms/${form.id}`)
    }, [router])

    // Handle add form entry
    const handleAddFormEntry = useCallback(async (formId: string, data: TDigitalFormEntry) => {
        try {
            await addFormEntry(formId, data)
            setIsEntryModalVisible(false)
            fetchForms()
            toast({
                title: "Thành công",
                description: "Đã thêm dữ liệu công nhân."
            })
            return true
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể thêm dữ liệu công nhân.",
                variant: "destructive"
            })
            return false
        }
    }, [addFormEntry, fetchForms])

    // Handle create new form for selected employee
    const handleCreateEmployeeForm = useCallback(() => {
        if (!selectedEmployee || !selectedDate) return

        const formattedDate = format(selectedDate, "yyyy-MM-dd")
        setIsCreateModalVisible(true)
    }, [selectedEmployee, selectedDate])

    // Render employee list view
    const renderEmployeeListView = () => {
        return (
            <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <h1 className="text-xl font-bold tracking-tight">Quản lý phiếu công đoạn</h1>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm công nhân..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <DatePicker
                                value={selectedDate}
                                onChange={setSelectedDate}
                                placeholder="Chọn ngày"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {isLoading || isLoadingAny ? (
                        <div className="text-center py-8">Đang tải...</div>
                    ) : filteredEmployees.length > 0 ? (
                        filteredEmployees.map(employee => (
                            <EmployeeCard
                                key={employee.id}
                                employee={employee}
                                hasFormToday={hasFormToday(employee.id)}
                                onSelect={() => handleSelectEmployee(employee)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Không tìm thấy công nhân nào
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Render employee detail view
    const renderEmployeeDetailView = () => {
        if (!selectedEmployee) return null

        const todayForms = getTodayForms(selectedEmployee.id)
        const hasForms = todayForms.length > 0

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToList}
                        className="flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                    <Button onClick={handleCreateEmployeeForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo phiếu mới
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-medium">{selectedEmployee.fullName}</h2>
                                <div className="flex flex-col sm:flex-row sm:gap-3 text-sm text-gray-500">
                                    <span>Mã: {selectedEmployee.employeeCode}</span>
                                    <span>Đơn vị: {selectedEmployee.department}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-md font-medium">
                                    Phiếu công đoạn ngày {format(selectedDate || new Date(), 'dd/MM/yyyy')}
                                </h3>
                                <Badge>
                                    {todayForms.length} phiếu
                                </Badge>
                            </div>

                            {!hasForms && (
                                <div className="text-center py-6 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">Công nhân chưa có phiếu công đoạn cho ngày hôm nay</p>
                                    <Button
                                        variant="outline"
                                        className="mt-2"
                                        onClick={handleCreateEmployeeForm}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tạo phiếu mới
                                    </Button>
                                </div>
                            )}

                            {hasForms && (
                                <div className="space-y-2">
                                    {todayForms.map((form) => (
                                        <FormCard
                                            key={form.id}
                                            form={form}
                                            onView={() => handleViewForm(form)}
                                            onEdit={() => handleEditForm(form)}
                                            onDelete={() => handleDeleteForm(form.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            {viewMode === 'list' ? renderEmployeeListView() : renderEmployeeDetailView()}

            {/* Create Form Modal */}
            <CreateFormModal
                visible={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                onCreate={handleCreateForm}
                defaultFactoryId="b1a2ab78-e5fc-4e44-bb39-db59e0630251"
            />

            {/* Form Entry Modal */}
            {isEntryModalVisible && selectedForm && (
                <FormEntryModal
                    visible={isEntryModalVisible}
                    onCancel={() => setIsEntryModalVisible(false)}
                    onSave={(data) => handleAddFormEntry(selectedForm.id, data)}
                    entry={selectedEntry}
                    formId={selectedForm.id}
                    shiftType={selectedForm.shiftType}
                />
            )}
        </div>
    )
}

export default DigitalFormList;























// "use client"
// import React, { useState, useMemo, useCallback, useEffect } from "react"
// import { useRouter } from "next/navigation"
// import { format } from "date-fns"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Separator } from "@/components/ui/separator"
// import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
// import { Calendar, ChevronLeft, Filter, Plus, Search } from "lucide-react"
// import { DatePicker } from "@/components/ui/date-picker"
// import { toast } from "@/hooks/use-toast"
// import { useDigitalFormContext } from "@/hooks/digital-form/DigitalFormContext"
// import CreateFormModal from "./CreateFormModal"
// import { RecordStatus, DigitalForm } from "@/common/types/digital-form"

// // Compact form display component for list view
// const FormCard: React.FC<{
//     form: DigitalForm;
//     onView: () => void;
// }> = ({ form, onView }) => {
//     // Helper to get status styles
//     const getStatusStyles = (status: RecordStatus) => {
//         switch (status) {
//             case RecordStatus.DRAFT:
//                 return "bg-blue-100 text-blue-800";
//             case RecordStatus.PENDING:
//                 return "bg-yellow-100 text-yellow-800";
//             case RecordStatus.CONFIRMED:
//                 return "bg-green-100 text-green-800";
//             case RecordStatus.REJECTED:
//                 return "bg-red-100 text-red-800";
//             default:
//                 return "bg-gray-100 text-gray-800";
//         }
//     };

//     // Helper to get shift label
//     const getShiftLabel = (shift: string) => {
//         switch (shift) {
//             case "REGULAR":
//                 return "Ca Chính";
//             case "EXTENDED":
//                 return "Ca Kéo Dài";
//             case "OVERTIME":
//                 return "Ca Tăng Ca";
//             default:
//                 return shift;
//         }
//     };

//     return (
//         <Card
//             className="cursor-pointer hover:border-blue-500 transition-all mb-4"
//             onClick={onView}
//         >
//             <CardContent className="p-4">
//                 <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center">
//                         <h3 className="font-medium text-gray-900">{form.formName}</h3>
//                         <Badge className="ml-2">{form.formCode}</Badge>
//                     </div>
//                     <Badge className={`${getStatusStyles(form.status)}`}>
//                         {form.status}
//                     </Badge>
//                 </div>

//                 <div className="grid grid-cols-3 text-sm text-gray-500">
//                     <div className="flex items-center">
//                         <Calendar className="h-4 w-4 mr-1" />
//                         <span>{format(new Date(form.date), "dd/MM/yyyy")}</span>
//                     </div>
//                     <div>Ca: {getShiftLabel(form.shiftType)}</div>
//                     <div>Ngày tạo: {format(new Date(form.createdAt), "dd/MM/yyyy")}</div>
//                 </div>
//             </CardContent>
//         </Card>
//     );
// };

// const DigitalFormList: React.FC = () => {
//     const router = useRouter();
//     const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
//     const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
//     const [selectedForm, setSelectedForm] = useState<DigitalForm | null>(null);
//     const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
//     const [searchTerm, setSearchTerm] = useState('');

//     // Use digital form context
//     const {
//         filters,
//         updateFilter,
//         fetchForms,
//         createForm,
//         deleteForm,
//         viewForm,
//         isLoadingAny,
//         getStatusLabel,
//         getStatusColor,
//         getShiftLabel,
//     } = useDigitalFormContext();

//     // Custom hook from context
//     const { listForms, batchPrefetchForms } = useDigitalFormContext();
//     const { data: formsData, isLoading } = listForms(filters);

//     // Prefetch forms for better UX
//     useEffect(() => {
//         if (formsData?.data?.length) {
//             const formIds = formsData.data.slice(0, 3).map((form) => form.id);
//             batchPrefetchForms(formIds);
//         }
//     }, [formsData, batchPrefetchForms]);

//     // Create new form handler
//     const handleCreateForm = useCallback(
//         async (formData: any) => {
//             try {
//                 const result = await createForm(formData);
//                 setIsCreateModalVisible(false);
//                 if (result?.data?.id) {
//                     toast({
//                         title: "Thành công",
//                         description: "Đã tạo phiếu mới thành công",
//                     });
//                     viewForm(result.data.id);
//                 }
//                 return true;
//             } catch (error) {
//                 toast({
//                     title: "Lỗi",
//                     description: "Không thể tạo phiếu.",
//                     variant: "destructive"
//                 });
//                 return false;
//             }
//         },
//         [createForm, viewForm, toast],
//     );

//     // Delete form handler
//     const handleDeleteForm = useCallback(
//         async (id: string) => {
//             try {
//                 await deleteForm(id);
//                 toast({
//                     title: "Thành công",
//                     description: "Đã xóa phiếu."
//                 });
//                 return true;
//             } catch (error) {
//                 toast({
//                     title: "Lỗi",
//                     description: "Không thể xóa phiếu.",
//                     variant: "destructive"
//                 });
//                 return false;
//             }
//         },
//         [deleteForm, toast],
//     );

//     // Handle page change for pagination
//     const handlePageChange = useCallback(
//         (pageIndex: number, pageSize: number) => {
//             updateFilter("page", pageIndex + 1);
//             updateFilter("limit", pageSize);
//         },
//         [updateFilter],
//     );

//     // Handle view form
//     const handleViewForm = useCallback((form: DigitalForm) => {
//         setSelectedForm(form);
//         setViewMode('detail');
//         router.push(`/digital-forms/${form.id}`);
//     }, [router]);

//     // Handle back to list
//     const handleBackToList = useCallback(() => {
//         setSelectedForm(null);
//         setViewMode('list');
//     }, []);

//     // Filter forms by search term
//     const filteredForms = useMemo(() => {
//         if (!formsData?.data || !searchTerm.trim()) {
//             return formsData?.data || [];
//         }

//         const term = searchTerm.toLowerCase();
//         return formsData.data.filter(form =>
//             form.formName.toLowerCase().includes(term) ||
//             form.formCode.toLowerCase().includes(term)
//         );
//     }, [formsData, searchTerm]);

//     return (
//         <div className="container mx-auto py-6">
//             {viewMode === 'list' ? (
//                 // List View
//                 <>
//                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
//                         <h1 className="text-2xl font-bold">Phiếu Công Đoạn</h1>

//                         <div className="flex flex-col sm:flex-row gap-3">
//                             <div className="relative">
//                                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                                 <Input
//                                     placeholder="Tìm kiếm..."
//                                     value={searchTerm}
//                                     onChange={(e) => setSearchTerm(e.target.value)}
//                                     className="pl-9"
//                                 />
//                             </div>

//                             <Button
//                                 variant="outline"
//                                 size="icon"
//                                 onClick={() => setIsFilterModalVisible(true)}
//                             >
//                                 <Filter className="h-4 w-4" />
//                             </Button>

//                             <Button onClick={() => setIsCreateModalVisible(true)}>
//                                 <Plus className="h-4 w-4 mr-2" />
//                                 Tạo phiếu mới
//                             </Button>
//                         </div>
//                     </div>

//                     {/* Active Filters Display */}
//                     <div className="flex flex-wrap gap-2 mb-4">
//                         {filters.dateFrom && (
//                             <Badge variant="outline" className="bg-blue-50">
//                                 Từ ngày: {format(new Date(filters.dateFrom), "dd/MM/yyyy")}
//                             </Badge>
//                         )}
//                         {filters.dateTo && (
//                             <Badge variant="outline" className="bg-blue-50">
//                                 Đến ngày: {format(new Date(filters.dateTo), "dd/MM/yyyy")}
//                             </Badge>
//                         )}
//                         {filters.status && (
//                             <Badge variant="outline" className={`bg-${getStatusColor(filters.status)}-50`}>
//                                 Trạng thái: {getStatusLabel(filters.status)}
//                             </Badge>
//                         )}
//                     </div>

//                     {/* Form List */}
//                     <div className="space-y-4">
//                         {isLoading || isLoadingAny ? (
//                             <div className="text-center py-8">Đang tải...</div>
//                         ) : filteredForms.length > 0 ? (
//                             filteredForms.map((form) => (
//                                 <FormCard
//                                     key={form.id}
//                                     form={form}
//                                     onView={() => handleViewForm(form)}
//                                 />
//                             ))
//                         ) : (
//                             <div className="text-center py-8 text-gray-500">
//                                 Không tìm thấy phiếu công đoạn
//                             </div>
//                         )}
//                     </div>

//                     {/* Pagination */}
//                     {formsData?.total && formsData.total > 0 && (
//                         <div className="flex justify-between items-center mt-4">
//                             <div className="text-sm text-gray-500">
//                                 Hiển thị {filteredForms.length} trên tổng số {formsData.total} phiếu
//                             </div>
//                             <div className="flex gap-2">
//                                 <Button
//                                     variant="outline"
//                                     size="sm"
//                                     disabled={filters.page === 1}
//                                     onClick={() => handlePageChange(filters.page - 2, filters.limit)}
//                                 >
//                                     Trước
//                                 </Button>
//                                 <Button
//                                     variant="outline"
//                                     size="sm"
//                                     disabled={filters.page * filters.limit >= formsData.total}
//                                     onClick={() => handlePageChange(filters.page, filters.limit)}
//                                 >
//                                     Sau
//                                 </Button>
//                             </div>
//                         </div>
//                     )}

//                     {/* Create Form Modal */}
//                     <CreateFormModal
//                         visible={isCreateModalVisible}
//                         onCancel={() => setIsCreateModalVisible(false)}
//                         onCreate={handleCreateForm}
//                         defaultFactoryId="b1a2ab78-e5fc-4e44-bb39-db59e0630251"
//                     />

//                     {/* Filter Modal */}
//                     <Dialog open={isFilterModalVisible} onOpenChange={setIsFilterModalVisible}>
//                         <DialogContent className="sm:max-w-md">
//                             <DialogTitle>Bộ lọc</DialogTitle>
//                             <div className="grid gap-4 py-4">
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <DatePicker
//                                         value={filters.dateFrom}
//                                         onChange={(date) => updateFilter("dateFrom", date)}
//                                         placeholder="Từ ngày"
//                                     />
//                                     <DatePicker
//                                         value={filters.dateTo}
//                                         onChange={(date) => updateFilter("dateTo", date)}
//                                         placeholder="Đến ngày"
//                                     />
//                                     <Select
//                                         value={filters.status || "all"}
//                                         onValueChange={(value) => updateFilter("status", value === "all" ? undefined : (value as RecordStatus))}
//                                     >
//                                         <SelectTrigger>
//                                             <SelectValue placeholder="Trạng thái" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="all">Tất cả</SelectItem>
//                                             {Object.values(RecordStatus).map((status) => (
//                                                 <SelectItem key={status} value={status}>
//                                                     {getStatusLabel(status)}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>
//                                 </div>
//                                 <div className="flex justify-end gap-2">
//                                     <Button
//                                         variant="outline"
//                                         onClick={() => {
//                                             updateFilter("dateFrom", null);
//                                             updateFilter("dateTo", null);
//                                             updateFilter("status", undefined);
//                                             updateFilter("search", "");
//                                             setIsFilterModalVisible(false);
//                                         }}
//                                     >
//                                         Đặt lại
//                                     </Button>
//                                     <Button onClick={() => setIsFilterModalVisible(false)}>
//                                         Áp dụng
//                                     </Button>
//                                 </div>
//                             </div>
//                         </DialogContent>
//                     </Dialog>
//                 </>
//             ) : (
//                 // Will be handled by the detailed view component
//                 <div>Redirecting to detailed view...</div>
//             )}
//         </div>
//     );
// };

// export default DigitalFormList;