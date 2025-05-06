// // screens/digital-form/CreateForm.tsx
// "use client"

// import { useState, useCallback } from "react"
// import { useRouter } from "next/navigation"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import * as z from "zod"
// import { format } from "date-fns"
// import { vi } from "date-fns/locale"
// import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { DatePicker } from "@/components/ui/date-picker"
// import { Separator } from "@/components/ui/separator"
// import { Loader2, Calendar, ArrowLeft } from "lucide-react"
// import { ShiftType } from "@/common/types/digital-form"
// import useDigitalFormManager from "@/hooks/digital-form/useDigitalFormManager"
// import { useToast } from "@/hooks/use-toast"
// import { TDigitalFormCreate } from "@/schemas/digital-form.schema"

// // Schema for form validation
// const formSchema = z.object({
//     formName: z.string().min(3, "Tên biểu mẫu phải có ít nhất 3 ký tự").max(100),
//     description: z.string().optional(),
//     date: z.date({
//         required_error: "Vui lòng chọn ngày",
//     }),
//     shiftType: z.nativeEnum(ShiftType, {
//         required_error: "Vui lòng chọn loại ca",
//     }),
//     factoryId: z.string().uuid({
//         message: "Vui lòng chọn nhà máy",
//     }),
//     lineId: z.string().uuid({
//         message: "Vui lòng chọn dây chuyền",
//     }),
//     teamId: z.string().uuid({
//         message: "Vui lòng chọn tổ",
//     }),
//     groupId: z.string().uuid({
//         message: "Vui lòng chọn nhóm",
//     }),
// });

// // Mock data for dropdowns - replace with actual API calls in production
// const FACTORIES = [
//     { id: "550e8400-e29b-41d4-a716-446655440000", name: "Nhà máy Hà Nội" },
//     { id: "550e8400-e29b-41d4-a716-446655440001", name: "Nhà máy Hồ Chí Minh" },
// ];

// const LINES = [
//     { id: "550e8400-e29b-41d4-a716-446655440002", name: "Dây chuyền A", factoryId: "550e8400-e29b-41d4-a716-446655440000" },
//     { id: "550e8400-e29b-41d4-a716-446655440003", name: "Dây chuyền B", factoryId: "550e8400-e29b-41d4-a716-446655440000" },
//     { id: "550e8400-e29b-41d4-a716-446655440004", name: "Dây chuyền C", factoryId: "550e8400-e29b-41d4-a716-446655440001" },
// ];

// const TEAMS = [
//     { id: "550e8400-e29b-41d4-a716-446655440005", name: "Tổ 1", lineId: "550e8400-e29b-41d4-a716-446655440002" },
//     { id: "550e8400-e29b-41d4-a716-446655440006", name: "Tổ 2", lineId: "550e8400-e29b-41d4-a716-446655440002" },
//     { id: "550e8400-e29b-41d4-a716-446655440007", name: "Tổ 3", lineId: "550e8400-e29b-41d4-a716-446655440003" },
//     { id: "550e8400-e29b-41d4-a716-446655440008", name: "Tổ 4", lineId: "550e8400-e29b-41d4-a716-446655440004" },
// ];

// const GROUPS = [
//     { id: "550e8400-e29b-41d4-a716-446655440009", name: "Nhóm A", teamId: "550e8400-e29b-41d4-a716-446655440005" },
//     { id: "550e8400-e29b-41d4-a716-446655440010", name: "Nhóm B", teamId: "550e8400-e29b-41d4-a716-446655440005" },
//     { id: "550e8400-e29b-41d4-a716-446655440011", name: "Nhóm C", teamId: "550e8400-e29b-41d4-a716-446655440006" },
//     { id: "550e8400-e29b-41d4-a716-446655440012", name: "Nhóm D", teamId: "550e8400-e29b-41d4-a716-446655440007" },
//     { id: "550e8400-e29b-41d4-a716-446655440013", name: "Nhóm E", teamId: "550e8400-e29b-41d4-a716-446655440008" },
// ];

// export default function CreateDigitalForm() {
//     const router = useRouter()
//     const { toast } = useToast()
//     const formManager = useDigitalFormManager()

//     const [isSubmitting, setIsSubmitting] = useState(false)
//     const [selectedFactory, setSelectedFactory] = useState<string | null>(null)
//     const [selectedLine, setSelectedLine] = useState<string | null>(null)
//     const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

//     // Initialize form
//     const form = useForm<z.infer<typeof formSchema>>({
//         resolver: zodResolver(formSchema),
//         defaultValues: {
//             formName: `Biểu mẫu ngày ${format(new Date(), 'dd/MM/yyyy', { locale: vi })}`,
//             description: "",
//             date: new Date(),
//             shiftType: ShiftType.REGULAR,
//         },
//     })

//     // Filter dependent dropdowns
//     const filteredLines = selectedFactory
//         ? LINES.filter(line => line.factoryId === selectedFactory)
//         : []

//     const filteredTeams = selectedLine
//         ? TEAMS.filter(team => team.lineId === selectedLine)
//         : []

//     const filteredGroups = selectedTeam
//         ? GROUPS.filter(group => group.teamId === selectedTeam)
//         : []

//     // Handle factory change
//     const handleFactoryChange = useCallback((value: string) => {
//         setSelectedFactory(value)
//         setSelectedLine(null)
//         setSelectedTeam(null)
//         form.setValue("lineId", "" as any)
//         form.setValue("teamId", "" as any)
//         form.setValue("groupId", "" as any)
//     }, [form])

//     // Handle line change
//     const handleLineChange = useCallback((value: string) => {
//         setSelectedLine(value)
//         setSelectedTeam(null)
//         form.setValue("teamId", "" as any)
//         form.setValue("groupId", "" as any)
//     }, [form])

//     // Handle team change
//     const handleTeamChange = useCallback((value: string) => {
//         setSelectedTeam(value)
//         form.setValue("groupId", "" as any)
//     }, [form])

//     // Handle form submission
//     const onSubmit = async (data: z.infer<typeof formSchema>) => {
//         setIsSubmitting(true)
//         try {
//             // Convert date to ISO string format for API
//             const formData: TDigitalFormCreate = {
//                 ...data,
//                 date: format(data.date, 'yyyy-MM-dd'),
//             }

//             const formId = await formManager.createNewForm(formData)

//             if (formId) {
//                 toast({
//                     title: "Thành công",
//                     description: "Đã tạo biểu mẫu mới thành công",
//                 })
//                 // Navigate to the new form
//                 router.push(`/digital-forms/${formId}`)
//             } else {
//                 throw new Error("Không thể tạo biểu mẫu")
//             }
//         } catch (error) {
//             console.error("Error creating form:", error)
//             toast({
//                 title: "Lỗi",
//                 description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo biểu mẫu",
//                 variant: "destructive",
//             })
//         } finally {
//             setIsSubmitting(false)
//         }
//     }

//     // Handle back button
//     const handleBack = () => {
//         router.push("/digital-forms")
//     }

//     return (
//         <main className="container max-w-2xl mx-auto p-4 pb-24">
//             <div className="mb-4">
//                 <Button variant="ghost" onClick={handleBack}>
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Quay lại danh sách
//                 </Button>
//             </div>

//             <Card>
//                 <CardHeader>
//                     <CardTitle>Tạo biểu mẫu số mới</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     <Form {...form}>
//                         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//                             <FormField
//                                 control={form.control}
//                                 name="formName"
//                                 render={({ field }) => (
//                                     <FormItem>
//                                         <FormLabel>Tên biểu mẫu</FormLabel>
//                                         <FormControl>
//                                             <Input {...field} />
//                                         </FormControl>
//                                         <FormMessage />
//                                     </FormItem>
//                                 )}
//                             />

//                             <FormField
//                                 control={form.control}
//                                 name="description"
//                                 render={({ field }) => (
//                                     <FormItem>
//                                         <FormLabel>Mô tả (tùy chọn)</FormLabel>
//                                         <FormControl>
//                                             <Input {...field} />
//                                         </FormControl>
//                                         <FormMessage />
//                                     </FormItem>
//                                 )}
//                             />

//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                 <FormField
//                                     control={form.control}
//                                     name="date"
//                                     render={({ field }) => (
//                                         <FormItem className="flex flex-col">
//                                             <FormLabel>Ngày</FormLabel>
//                                             <DatePicker
//                                                 date={field.value}
//                                                 onSelect={field.onChange}
//                                             />
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />

//                                 <FormField
//                                     control={form.control}
//                                     name="shiftType"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel>Loại ca</FormLabel>
//                                             <Select
//                                                 onValueChange={field.onChange}
//                                                 defaultValue={field.value}
//                                             >
//                                                 <FormControl>
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="Chọn loại ca" />
//                                                     </SelectTrigger>
//                                                 </FormControl>
//                                                 <SelectContent>
//                                                     <SelectItem value={ShiftType.REGULAR}>Ca thường (07:30 - 16:30)</SelectItem>
//                                                     <SelectItem value={ShiftType.EXTENDED}>Ca kéo dài (16:30 - 18:00)</SelectItem>
//                                                     <SelectItem value={ShiftType.OVERTIME}>Ca tăng ca (18:00 - 20:00)</SelectItem>
//                                                 </SelectContent>
//                                             </Select>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />
//                             </div>

//                             <Separator />

//                             <div className="space-y-6">
//                                 <h3 className="text-lg font-medium">Thông tin tổ chức</h3>

//                                 <FormField
//                                     control={form.control}
//                                     name="factoryId"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel>Nhà máy</FormLabel>
//                                             <Select
//                                                 onValueChange={(value) => {
//                                                     field.onChange(value)
//                                                     handleFactoryChange(value)
//                                                 }}
//                                                 value={field.value}
//                                             >
//                                                 <FormControl>
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="Chọn nhà máy" />
//                                                     </SelectTrigger>
//                                                 </FormControl>
//                                                 <SelectContent>
//                                                     {FACTORIES.map((factory) => (
//                                                         <SelectItem key={factory.id} value={factory.id}>
//                                                             {factory.name}
//                                                         </SelectItem>
//                                                     ))}
//                                                 </SelectContent>
//                                             </Select>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />

//                                 <FormField
//                                     control={form.control}
//                                     name="lineId"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel>Dây chuyền</FormLabel>
//                                             <Select
//                                                 onValueChange={(value) => {
//                                                     field.onChange(value)
//                                                     handleLineChange(value)
//                                                 }}
//                                                 value={field.value}
//                                                 disabled={!selectedFactory}
//                                             >
//                                                 <FormControl>
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="Chọn dây chuyền" />
//                                                     </SelectTrigger>
//                                                 </FormControl>
//                                                 <SelectContent>
//                                                     {filteredLines.map((line) => (
//                                                         <SelectItem key={line.id} value={line.id}>
//                                                             {line.name}
//                                                         </SelectItem>
//                                                     ))}
//                                                 </SelectContent>
//                                             </Select>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />

//                                 <FormField
//                                     control={form.control}
//                                     name="teamId"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel>Tổ</FormLabel>
//                                             <Select
//                                                 onValueChange={(value) => {
//                                                     field.onChange(value)
//                                                     handleTeamChange(value)
//                                                 }}
//                                                 value={field.value}
//                                                 disabled={!selectedLine}
//                                             >
//                                                 <FormControl>
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="Chọn tổ" />
//                                                     </SelectTrigger>
//                                                 </FormControl>
//                                                 <SelectContent>
//                                                     {filteredTeams.map((team) => (
//                                                         <SelectItem key={team.id} value={team.id}>
//                                                             {team.name}
//                                                         </SelectItem>
//                                                     ))}
//                                                 </SelectContent>
//                                             </Select>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />

//                                 <FormField
//                                     control={form.control}
//                                     name="groupId"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel>Nhóm</FormLabel>
//                                             <Select
//                                                 onValueChange={field.onChange}
//                                                 value={field.value}
//                                                 disabled={!selectedTeam}
//                                             >
//                                                 <FormControl>
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="Chọn nhóm" />
//                                                     </SelectTrigger>
//                                                 </FormControl>
//                                                 <SelectContent>
//                                                     {filteredGroups.map((group) => (
//                                                         <SelectItem key={group.id} value={group.id}>
//                                                             {group.name}
//                                                         </SelectItem>
//                                                     ))}
//                                                 </SelectContent>
//                                             </Select>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />
//                             </div>

//                             <CardFooter className="flex justify-end px-0 pb-0 pt-6">
//                                 <Button type="button" variant="outline" className="mr-2" onClick={handleBack}>
//                                     Hủy
//                                 </Button>
//                                 <Button type="submit" disabled={isSubmitting}>
//                                     {isSubmitting ? (
//                                         <>
//                                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                             Đang tạo...
//                                         </>
//                                     ) : (
//                                         "Tạo biểu mẫu"
//                                     )}
//                                 </Button>
//                             </CardFooter>
//                         </form>
//                     </Form>
//                 </CardContent>
//             </Card>
//         </main>
//     )
// }