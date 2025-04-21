import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Import enhanced types
import { 
  Employee, 
  BagCode, 
  Operation, 
  WorkLog, 
  EnhancedWorkLog, 
  WorkEntry,
  enhancedToLegacyWorkLog,
  legacyToEnhancedWorkLog,
  groupWorkLogs
} from './workLogTypes';

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

// Mock data from existing service
const mockEmployees: Employee[] = [
  {
    id: '1',
    code: 'NV001',
    name: 'Nguyễn Văn A',
    department: 'Sản xuất',
    cardNumber: 'CARD-001',
  },
  {
    id: '2',
    code: 'NV002',
    name: 'Trần Thị B',
    department: 'Hoàn thiện',
    cardNumber: 'CARD-002',
  },
  {
    id: '3',
    code: 'NV003',
    name: 'Lê Văn C',
    department: 'Kiểm tra chất lượng',
    cardNumber: 'CARD-003',
  },
  {
    id: '4',
    code: 'NV004',
    name: 'Phạm Thị D',
    department: 'Sản xuất',
    cardNumber: 'CARD-004',
  },
  {
    id: '5',
    code: 'NV005',
    name: 'Hoàng Văn E',
    department: 'Hoàn thiện',
    cardNumber: 'CARD-005',
  },
];

const mockBagCodes: BagCode[] = [
  { value: 'BAG001', label: 'Túi loại A' },
  { value: 'BAG002', label: 'Túi loại B' },
  { value: 'BAG003', label: 'Túi loại C' },
  { value: 'BAG004', label: 'Túi loại D' },
  { value: 'BAG005', label: 'Túi loại E' },
];

const mockOperations: Operation[] = [
  { code: 'OP001', name: 'May lót', hourlyTarget: 25 },
  { code: 'OP002', name: 'May thân', hourlyTarget: 20 },
  { code: 'OP003', name: 'May ráp', hourlyTarget: 18 },
  { code: 'OP004', name: 'Chặt', hourlyTarget: 30 },
  { code: 'OP005', name: 'Lạng', hourlyTarget: 10 },
  { code: 'OP006', name: 'Hoàn thiện', hourlyTarget: 15 },
];

const workingTimeOptions = [
  { value: '8_hours', label: '8 tiếng (07:30 - 16:30)' },
  { value: '9.5_hours', label: '9 tiếng 30 phút (07:30 - 18:00)' },
  { value: '11_hours', label: '11 tiếng (07:30 - 20:00)' },
];

// Helper function to get time slots based on working time (carried over from original)
const getTimeSlotsForWorkingTime = (workingTime: string): string[] => {
  switch (workingTime) {
    case "8_hours":
      return ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30"];
    case "9.5_hours":
      return ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30","16:30-17:00", "17:00-18:00"];
    case "11_hours":
      return ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00", "18:00-19:00", "19:00-20:00"];
    default:
      return [];
  }
};

// Generate mock work entries
const generateMockWorkEntry = (employeeId: string, date: Date): WorkEntry => {
  const randomOperation = mockOperations[Math.floor(Math.random() * mockOperations.length)];
  const randomBagCode = mockBagCodes[Math.floor(Math.random() * mockBagCodes.length)];
  
  // Generate production data
  const production: Record<string, number> = {};
  const timeSlots = getTimeSlotsForWorkingTime('8_hours'); // Default to 8 hours
  timeSlots.forEach(slot => {
    production[slot] = Math.floor(Math.random() * 30) + 5; // Random 5-35
  });
  
  // Calculate total production
  const totalProduction = Object.values(production).reduce((sum, value) => sum + value, 0);
  
  return {
    id: uuidv4(),
    bagCode: randomBagCode.value,
    operationCode: randomOperation.code,
    operationName: randomOperation.name,
    hourlyTarget: randomOperation.hourlyTarget,
    production,
    totalProduction,
    performanceReason: {
      material: "",
      technology: "",
      quality: "",
      machinery: "",
    }
  };
};

// Generate enhanced mock work logs
const generateMockEnhancedWorkLogs = (): EnhancedWorkLog[] => {
  const logs: EnhancedWorkLog[] = [];
  
  mockEmployees.forEach(emp => {
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const randomWorkingTime = workingTimeOptions[Math.floor(Math.random() * workingTimeOptions.length)].value;
      const now = new Date().toISOString();
      
      // Create 1-3 entries per day (to simulate multiple bag codes/operations)
      const entriesCount = Math.floor(Math.random() * 3) + 1;
      const entries: WorkEntry[] = [];
      
      for (let j = 0; j < entriesCount; j++) {
        entries.push(generateMockWorkEntry(emp.id, date));
      }
      
      logs.push({
        id: uuidv4(),
        date: dateStr,
        employeeId: emp.id,
        employeeCode: emp.code,
        employeeName: emp.name,
        department: emp.department,
        cardNumber: emp.cardNumber,
        workingTime: randomWorkingTime,
        entries,
        status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)] as 'pending' | 'approved' | 'rejected',
        createdAt: now,
        updatedAt: now,
      });
    }
  });
  
  return logs;
};

// Service hook
export const useEnhancedWorkLogService = () => {
  const [employees] = useState<Employee[]>(mockEmployees);
  const [bagCodes] = useState<BagCode[]>(mockBagCodes);
  const [operations] = useState<Operation[]>(mockOperations);
  const [enhancedWorkLogs, setEnhancedWorkLogs] = useState<EnhancedWorkLog[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Fetch work logs (simulated)
  const fetchWorkLogs = useCallback(async () => {
    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get mock data from localStorage or generate new
      let storedLogs = localStorage.getItem('enhancedWorkLogs');
      let logs: EnhancedWorkLog[] = [];
      
      if (storedLogs) {
        logs = JSON.parse(storedLogs);
      } else {
        logs = generateMockEnhancedWorkLogs();
        localStorage.setItem('enhancedWorkLogs', JSON.stringify(logs));
      }

      // Convert to legacy format for compatibility with existing UI
      const flattenedLogs: WorkLog[] = logs.flatMap(enhancedToLegacyWorkLog);
      
      // Apply pagination
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      const paginatedLogs = flattenedLogs.slice(start, end);
      
      setEnhancedWorkLogs(logs);
      setWorkLogs(paginatedLogs);
      setPagination(prev => ({
        ...prev,
        total: flattenedLogs.length,
      }));
    } catch (error) {
      console.error('Error fetching work logs:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // Load initial data
  useEffect(() => {
    fetchWorkLogs();
  }, [fetchWorkLogs]);

  // Function to get employee details by ID
  const getEmployeeDetails = useCallback((employeeId: string) => {
    return employees.find(emp => emp.id === employeeId);
  }, [employees]);

  // Function to get operation details by code
  const getOperationDetails = useCallback((operationName: string) => {
    return operations.find(op => op.name === operationName);
  }, [operations]);

  // Update pagination
  const updatePagination = useCallback((page: number, limit: number) => {
    setPagination({
      page,
      limit,
      total: pagination.total,
    });
  }, [pagination.total]);

  // Create a new work entry for an existing work log or create a new work log
  const createWorkEntry = useCallback(async (
    data: Omit<WorkLog, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkLog> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const now = new Date().toISOString();
    
    // Get existing logs
    const storedLogs = localStorage.getItem('enhancedWorkLogs');
    let logs: EnhancedWorkLog[] = storedLogs ? JSON.parse(storedLogs) : [];
    
    // Check if there's already a worklog for this employee on this date
    const existingLogIndex = logs.findIndex(
      log => log.employeeId === data.employeeId && log.date === data.date
    );
    
    let newWorkLog: WorkLog;
    
    if (existingLogIndex >= 0) {
      // Add a new entry to existing work log
      const newEntry: WorkEntry = {
        id: uuidv4(),
        bagCode: data.bagCode,
        operationCode: data.operationCode,
        operationName: data.operationName,
        hourlyTarget: data.hourlyTarget,
        production: data.production,
        totalProduction: data.totalProduction,
        performanceReason: data.performanceReason
      };
      
      logs[existingLogIndex].entries.push(newEntry);
      logs[existingLogIndex].updatedAt = now;
      
      // Convert to legacy format for return
      newWorkLog = {
        id: `${logs[existingLogIndex].id}_${newEntry.id}`,
        date: logs[existingLogIndex].date,
        employeeId: logs[existingLogIndex].employeeId,
        employeeCode: logs[existingLogIndex].employeeCode,
        employeeName: logs[existingLogIndex].employeeName,
        department: logs[existingLogIndex].department,
        cardNumber: logs[existingLogIndex].cardNumber,
        workingTime: logs[existingLogIndex].workingTime,
        bagCode: newEntry.bagCode,
        operationCode: newEntry.operationCode,
        operationName: newEntry.operationName,
        hourlyTarget: newEntry.hourlyTarget,
        production: newEntry.production,
        totalProduction: newEntry.totalProduction,
        performanceReason: newEntry.performanceReason,
        status: logs[existingLogIndex].status,
        createdAt: logs[existingLogIndex].createdAt,
        updatedAt: now
      };
    } else {
      // Create a new enhanced work log
      const workLogId = uuidv4();
      const entryId = uuidv4();
      
      const newEnhancedLog: EnhancedWorkLog = {
        id: workLogId,
        date: data.date,
        employeeId: data.employeeId,
        employeeCode: data.employeeCode,
        employeeName: data.employeeName,
        department: data.department,
        cardNumber: data.cardNumber,
        workingTime: data.workingTime,
        entries: [{
          id: entryId,
          bagCode: data.bagCode,
          operationCode: data.operationCode,
          operationName: data.operationName,
          hourlyTarget: data.hourlyTarget,
          production: data.production,
          totalProduction: data.totalProduction,
          performanceReason: data.performanceReason
        }],
        status: data.status,
        createdAt: now,
        updatedAt: now
      };
      
      logs.push(newEnhancedLog);
      
      // Convert to legacy format for return
      newWorkLog = {
        id: `${workLogId}_${entryId}`,
        ...data,
        createdAt: now,
        updatedAt: now
      };
    }
    
    // Save to storage
    localStorage.setItem('enhancedWorkLogs', JSON.stringify(logs));
    
    return newWorkLog;
  }, []);

  // Update a work entry
  const updateWorkEntry = useCallback(async (id: string, data: Partial<WorkLog>): Promise<WorkLog> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Parse the composite ID to get the worklog ID and entry ID
    const [workLogId, entryId] = id.split('_');
    
    if (!workLogId || !entryId) {
      throw new Error('Invalid work log ID format');
    }
    
    // Get existing logs
    const storedLogs = localStorage.getItem('enhancedWorkLogs');
    if (!storedLogs) throw new Error('No logs found');
    
    let logs: EnhancedWorkLog[] = JSON.parse(storedLogs);
    
    // Find the log and entry
    const logIndex = logs.findIndex(log => log.id === workLogId);
    if (logIndex === -1) throw new Error('Work log not found');
    
    const entryIndex = logs[logIndex].entries.findIndex(entry => entry.id === entryId);
    if (entryIndex === -1) throw new Error('Work entry not found');
    
    const now = new Date().toISOString();
    
    // Update worklog's common fields if provided
    if (data.date) logs[logIndex].date = data.date;
    if (data.employeeId) {
      logs[logIndex].employeeId = data.employeeId;
      
      // Update employee details if employee changed
      const employee = getEmployeeDetails(data.employeeId);
      if (employee) {
        logs[logIndex].employeeCode = employee.code;
        logs[logIndex].employeeName = employee.name;
        logs[logIndex].department = employee.department;
        logs[logIndex].cardNumber = employee.cardNumber;
      }
    }
    if (data.workingTime) logs[logIndex].workingTime = data.workingTime;
    if (data.status) logs[logIndex].status = data.status;
    
    // Update the specific entry
    const updatedEntry = { ...logs[logIndex].entries[entryIndex] };
    
    if (data.bagCode) updatedEntry.bagCode = data.bagCode;
    if (data.operationCode) updatedEntry.operationCode = data.operationCode;
    if (data.operationName) updatedEntry.operationName = data.operationName;
    if (data.hourlyTarget) updatedEntry.hourlyTarget = data.hourlyTarget;
    if (data.production) updatedEntry.production = data.production;
    if (data.totalProduction) updatedEntry.totalProduction = data.totalProduction;
    if (data.performanceReason) updatedEntry.performanceReason = data.performanceReason;
    
    logs[logIndex].entries[entryIndex] = updatedEntry;
    logs[logIndex].updatedAt = now;
    
    // Save to storage
    localStorage.setItem('enhancedWorkLogs', JSON.stringify(logs));
    
    // Convert to legacy format for return
    const updatedWorkLog: WorkLog = {
      id: `${workLogId}_${entryId}`,
      date: logs[logIndex].date,
      employeeId: logs[logIndex].employeeId,
      employeeCode: logs[logIndex].employeeCode,
      employeeName: logs[logIndex].employeeName,
      department: logs[logIndex].department,
      cardNumber: logs[logIndex].cardNumber,
      workingTime: logs[logIndex].workingTime,
      bagCode: updatedEntry.bagCode,
      operationCode: updatedEntry.operationCode,
      operationName: updatedEntry.operationName,
      hourlyTarget: updatedEntry.hourlyTarget,
      production: updatedEntry.production,
      totalProduction: updatedEntry.totalProduction,
      performanceReason: updatedEntry.performanceReason,
      status: logs[logIndex].status,
      createdAt: logs[logIndex].createdAt,
      updatedAt: now
    };
    
    return updatedWorkLog;
  }, [getEmployeeDetails]);

  // Delete a work entry
  const deleteWorkEntry = useCallback(async (id: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Parse the composite ID
    const [workLogId, entryId] = id.split('_');
    
    if (!workLogId || !entryId) {
      throw new Error('Invalid work log ID format');
    }
    
    // Get existing logs
    const storedLogs = localStorage.getItem('enhancedWorkLogs');
    if (!storedLogs) throw new Error('No logs found');
    
    let logs: EnhancedWorkLog[] = JSON.parse(storedLogs);
    
    // Find the log
    const logIndex = logs.findIndex(log => log.id === workLogId);
    if (logIndex === -1) throw new Error('Work log not found');
    
    // If this is the only entry, delete the entire log
    if (logs[logIndex].entries.length === 1) {
      logs = logs.filter(log => log.id !== workLogId);
    } else {
      // Otherwise just remove the entry
      logs[logIndex].entries = logs[logIndex].entries.filter(entry => entry.id !== entryId);
      logs[logIndex].updatedAt = new Date().toISOString();
    }
    
    // Save to storage
    localStorage.setItem('enhancedWorkLogs', JSON.stringify(logs));
  }, []);

  // Export to PDF (simulated)
  const exportToPDF = useCallback((workLog: WorkLog) => {
    console.log('Exporting to PDF:', workLog);
    // In actual implementation, you'd use a library like jsPDF
  }, []);

  // Export to Excel (simulated)
  const exportToExcel = useCallback((workLog: WorkLog) => {
    console.log('Exporting to Excel:', workLog);
    // In actual implementation, you'd use a library like xlsx
  }, []);

  return {
    employees,
    bagCodes,
    operations,
    workingTimeOptions,
    workLogs,
    enhancedWorkLogs,
    loading,
    pagination,
    getEmployeeDetails,
    getOperationDetails,
    fetchWorkLogs,
    updatePagination,
    createWorkLog: createWorkEntry,
    updateWorkLog: updateWorkEntry,
    deleteWorkLog: deleteWorkEntry,
    exportToPDF,
    exportToExcel,
  };
};



























// import { useState, useCallback, useEffect } from 'react';
// import { v4 as uuidv4 } from 'uuid';

// // Types
// export interface Employee {
//   id: string;
//   code: string;
//   name: string;
//   department: string;
//   cardNumber: string;
// }

// export interface BagCode {
//   value: string;
//   label: string;
// }

// export interface Operation {
//   code: string;
//   name: string;
//   hourlyTarget: number;
// }

// export interface WorkLog {
//   id: string;
//   date: string;
//   employeeId: string;
//   employeeCode: string;
//   employeeName: string;
//   department: string;
//   cardNumber: string;
//   workingTime: string;
//   bagCode: string;
//   operationCode: string;
//   operationName: string;
//   hourlyTarget: number;
//   production: Record<string, number>;
//   totalProduction: number;
//   performanceReason: {
//     material: string;
//     technology: string;
//     quality: string;
//     machinery: string;
//   };
//   status: 'pending' | 'approved' | 'rejected';
//   createdAt: string;
//   updatedAt: string;
// }

// interface Pagination {
//   page: number;
//   limit: number;
//   total: number;
// }

// // Mock data
// const mockEmployees: Employee[] = [
//   {
//     id: '1',
//     code: 'NV001',
//     name: 'Nguyễn Văn A',
//     department: 'Sản xuất',
//     cardNumber: 'CARD-001',
//   },
//   {
//     id: '2',
//     code: 'NV002',
//     name: 'Trần Thị B',
//     department: 'Hoàn thiện',
//     cardNumber: 'CARD-002',
//   },
//   {
//     id: '3',
//     code: 'NV003',
//     name: 'Lê Văn C',
//     department: 'Kiểm tra chất lượng',
//     cardNumber: 'CARD-003',
//   },
//   {
//     id: '4',
//     code: 'NV004',
//     name: 'Phạm Thị D',
//     department: 'Sản xuất',
//     cardNumber: 'CARD-004',
//   },
//   {
//     id: '5',
//     code: 'NV005',
//     name: 'Hoàng Văn E',
//     department: 'Hoàn thiện',
//     cardNumber: 'CARD-005',
//   },
// ];

// const mockBagCodes: BagCode[] = [
//   { value: 'BAG001', label: 'Túi loại A' },
//   { value: 'BAG002', label: 'Túi loại B' },
//   { value: 'BAG003', label: 'Túi loại C' },
//   { value: 'BAG004', label: 'Túi loại D' },
//   { value: 'BAG005', label: 'Túi loại E' },
// ];


// const mockOperations: Operation[] = [
//   { code: 'OP001', name: 'May lót', hourlyTarget: 25 },
//   { code: 'OP002', name: 'May thân', hourlyTarget: 20 },
//   { code: 'OP003', name: 'May ráp', hourlyTarget: 18 },
//   { code: 'OP004', name: 'Chặt', hourlyTarget: 30 },
//   { code: 'OP005', name: 'Lạng', hourlyTarget: 10 },
//   { code: 'OP006', name: 'Hoàn thiện', hourlyTarget: 15 },
// ];

// const workingTimeOptions = [
//   { value: '8_hours', label: '8 tiếng (07:30 - 16:30)' },
//   { value: '9.5_hours', label: '9 tiếng 30 phút (07:30 - 18:00)' },
//   { value: '11_hours', label: '11 tiếng (07:30 - 20:00)' },
// ];

// // Sample WorkLogs
// const generateMockWorkLogs = (): WorkLog[] => {
//   const logs: WorkLog[] = [];
  
//   // Tạo dữ liệu mẫu cho mỗi nhân viên trong 3 ngày
//   mockEmployees.forEach(emp => {
//     for (let i = 0; i < 3; i++) {
//       const date = new Date();
//       date.setDate(date.getDate() - i);
      
//       const randomOperation = mockOperations[Math.floor(Math.random() * mockOperations.length)];
//       const randomBagCode = mockBagCodes[Math.floor(Math.random() * mockBagCodes.length)];
//       const randomWorkingTime = workingTimeOptions[Math.floor(Math.random() * workingTimeOptions.length)];
      
//       // Tạo dữ liệu sản lượng giả cho mỗi khung giờ
//       const production: Record<string, number> = {};
//       const timeSlots = getTimeSlotsForWorkingTime(randomWorkingTime.value);
//       timeSlots.forEach(slot => {
//         production[slot] = Math.floor(Math.random() * 30) + 5; // Random 5-35
//       });
      
//       // Tính tổng sản lượng
//       const totalProduction = Object.values(production).reduce((sum, value) => sum + value, 0);
      
//       logs.push({
//         id: uuidv4(),
//         date: date.toISOString().split('T')[0],
//         employeeId: emp.id,
//         employeeCode: emp.code,
//         employeeName: emp.name,
//         department: emp.department,
//         cardNumber: emp.cardNumber,
//         workingTime: randomWorkingTime.value,
//         bagCode: randomBagCode.value,
//         operationCode: randomOperation.code,
//         operationName: randomOperation.name,
//         hourlyTarget: randomOperation.hourlyTarget,
//         production,
//         totalProduction,
//         performanceReason: {
//           material: "",
//           technology: "",
//           quality: "",
//           machinery: "",
//         },
//         status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)] as 'pending' | 'approved' | 'rejected',
//         createdAt: new Date(date).toISOString(),
//         updatedAt: new Date(date).toISOString(),
//       });
//     }
//   });
  
//   return logs;
// };

// // Helper function to get time slots based on working time
// const getTimeSlotsForWorkingTime = (workingTime: string): string[] => {
//   switch (workingTime) {
//     case "8_hours":
//       return ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30"];
//     case "9.5_hours":
//       return ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00"];
//     case "11_hours":
//       return ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00", "18:00-19:00", "19:00-20:00"];
//     default:
//       return [];
//   }
// };

// // Service hook
// export const useWorkLogService = () => {
//   const [employees] = useState<Employee[]>(mockEmployees);
//   const [bagCodes] = useState<BagCode[]>(mockBagCodes);
//   const [operations] = useState<Operation[]>(mockOperations);
//   const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [pagination, setPagination] = useState<Pagination>({
//     page: 1,
//     limit: 10,
//     total: 0,
//   });

//   // Fetch work logs (simulated)
//   const fetchWorkLogs = useCallback(async () => {
//     setLoading(true);
    
//     try {
//       // Simulate API call delay
//       await new Promise(resolve => setTimeout(resolve, 500));
      
//       // Get mock data from localStorage or generate new
//       let storedLogs = localStorage.getItem('workLogs');
//       let logs: WorkLog[] = [];
      
//       if (storedLogs) {
//         logs = JSON.parse(storedLogs);
//       } else {
//         logs = generateMockWorkLogs();
//         localStorage.setItem('workLogs', JSON.stringify(logs));
//       }
      
//       // Apply pagination
//       const start = (pagination.page - 1) * pagination.limit;
//       const end = start + pagination.limit;
//       const paginatedLogs = logs.slice(start, end);
      
//       setWorkLogs(paginatedLogs);
//       setPagination(prev => ({
//         ...prev,
//         total: logs.length,
//       }));
//     } catch (error) {
//       console.error('Error fetching work logs:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, [pagination.page, pagination.limit]);

//   // Load initial data
//   useEffect(() => {
//     fetchWorkLogs();
//   }, [fetchWorkLogs]);

//   // Function to get employee details by ID
//   const getEmployeeDetails = useCallback((employeeId: string) => {
//     return employees.find(emp => emp.id === employeeId);
//   }, [employees]);

//   // Function to get operation details by name
//   const getOperationDetails = useCallback((operationName: string) => {
//     return operations.find(op => op.name === operationName);
//   }, [operations]);

//   // Update pagination
//   const updatePagination = useCallback((page: number, limit: number) => {
//     setPagination({
//       page,
//       limit,
//       total: pagination.total,
//     });
//   }, [pagination.total]);

//   // Create a new work log
//   const createWorkLog = useCallback(async (data: Omit<WorkLog, 'id' | 'createdAt' | 'updatedAt'>) => {
//     // Simulate API call delay
//     await new Promise(resolve => setTimeout(resolve, 500));
    
//     const now = new Date().toISOString();
//     const newWorkLog: WorkLog = {
//       ...data,
//       id: uuidv4(),
//       createdAt: now,
//       updatedAt: now,
//     };
    
//     // Get existing logs
//     const storedLogs = localStorage.getItem('workLogs');
//     let logs: WorkLog[] = storedLogs ? JSON.parse(storedLogs) : [];
    
//     // Add new log
//     logs = [newWorkLog, ...logs];
    
//     // Save to storage
//     localStorage.setItem('workLogs', JSON.stringify(logs));
    
//     return newWorkLog;
//   }, []);

//   // Update a work log
//   const updateWorkLog = useCallback(async (id: string, data: Partial<WorkLog>) => {
//     // Simulate API call delay
//     await new Promise(resolve => setTimeout(resolve, 500));
    
//     // Get existing logs
//     const storedLogs = localStorage.getItem('workLogs');
//     if (!storedLogs) throw new Error('No logs found');
    
//     let logs: WorkLog[] = JSON.parse(storedLogs);
    
//     // Find and update log
//     const index = logs.findIndex(log => log.id === id);
//     if (index === -1) throw new Error('Log not found');
    
//     logs[index] = {
//       ...logs[index],
//       ...data,
//       updatedAt: new Date().toISOString(),
//     };
    
//     // Save to storage
//     localStorage.setItem('workLogs', JSON.stringify(logs));
    
//     return logs[index];
//   }, []);

//   // Delete a work log
//   const deleteWorkLog = useCallback(async (id: string) => {
//     // Simulate API call delay
//     await new Promise(resolve => setTimeout(resolve, 500));
    
//     // Get existing logs
//     const storedLogs = localStorage.getItem('workLogs');
//     if (!storedLogs) throw new Error('No logs found');
    
//     let logs: WorkLog[] = JSON.parse(storedLogs);
    
//     // Filter out deleted log
//     logs = logs.filter(log => log.id !== id);
    
//     // Save to storage
//     localStorage.setItem('workLogs', JSON.stringify(logs));
//   }, []);

//   // Export to PDF (simulated)
//   const exportToPDF = useCallback((workLog: WorkLog) => {
//     console.log('Exporting to PDF:', workLog);
//     // Trong thực tế, bạn sẽ sử dụng thư viện như jsPDF để tạo PDF
//   }, []);

//   // Export to Excel (simulated)
//   const exportToExcel = useCallback((workLog: WorkLog) => {
//     console.log('Exporting to Excel:', workLog);
//     // Trong thực tế, bạn sẽ sử dụng thư viện như xlsx để tạo Excel
//   }, []);

//   return {
//     employees,
//     bagCodes,
//     operations,
//     workingTimeOptions,
//     workLogs,
//     loading,
//     pagination,
//     getEmployeeDetails,
//     getOperationDetails,
//     fetchWorkLogs,
//     updatePagination,
//     createWorkLog,
//     updateWorkLog,
//     deleteWorkLog,
//     exportToPDF,
//     exportToExcel,
//   };
// }