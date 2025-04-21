// Enhanced WorkLog model to support multiple entries per day

// Base types (keep from existing model)
export interface Employee {
    id: string;
    code: string;
    name: string;
    department: string;
    cardNumber: string;
  }
  
  export interface BagCode {
    value: string;
    label: string;
  }
  
  export interface Operation {
    code: string;
    name: string;
    hourlyTarget: number;
  }
  
  // New Types for daily work entries
  export interface WorkEntry {
    id: string;
    bagCode: string;
    operationCode: string;
    operationName: string;
    hourlyTarget: number;
    production: Record<string, number>;
    totalProduction: number;
    performanceReason: {
      material: string;
      technology: string;
      quality: string;
      machinery: string;
    };
  }
  
  // Enhanced WorkLog structure
  export interface EnhancedWorkLog {
    id: string;
    date: string;
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    department: string;
    cardNumber: string;
    workingTime: string;
    entries: WorkEntry[];
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
  }
  
  // For backward compatibility
  export interface WorkLog {
    id: string;
    date: string;
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    department: string;
    cardNumber: string;
    workingTime: string;
    bagCode: string;
    operationCode: string;
    operationName: string;
    hourlyTarget: number;
    production: Record<string, number>;
    totalProduction: number;
    performanceReason: {
      material: string;
      technology: string;
      quality: string;
      machinery: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
  }
  
  // Helper functions to convert between formats
  export function enhancedToLegacyWorkLog(enhanced: EnhancedWorkLog): WorkLog[] {
    return enhanced.entries.map(entry => ({
      id: `${enhanced.id}_${entry.id}`,
      date: enhanced.date,
      employeeId: enhanced.employeeId,
      employeeCode: enhanced.employeeCode,
      employeeName: enhanced.employeeName,
      department: enhanced.department,
      cardNumber: enhanced.cardNumber,
      workingTime: enhanced.workingTime,
      bagCode: entry.bagCode,
      operationCode: entry.operationCode,
      operationName: entry.operationName,
      hourlyTarget: entry.hourlyTarget,
      production: entry.production,
      totalProduction: entry.totalProduction,
      performanceReason: entry.performanceReason,
      status: enhanced.status,
      createdAt: enhanced.createdAt,
      updatedAt: enhanced.updatedAt
    }));
  }
  
  export function legacyToEnhancedWorkLog(workLog: WorkLog): EnhancedWorkLog {
    return {
      id: workLog.id.split('_')[0] || workLog.id,
      date: workLog.date,
      employeeId: workLog.employeeId,
      employeeCode: workLog.employeeCode,
      employeeName: workLog.employeeName,
      department: workLog.department,
      cardNumber: workLog.cardNumber,
      workingTime: workLog.workingTime,
      entries: [
        {
          id: workLog.id.includes('_') ? workLog.id.split('_')[1] : 'entry1',
          bagCode: workLog.bagCode,
          operationCode: workLog.operationCode,
          operationName: workLog.operationName,
          hourlyTarget: workLog.hourlyTarget,
          production: workLog.production,
          totalProduction: workLog.totalProduction,
          performanceReason: workLog.performanceReason
        }
      ],
      status: workLog.status,
      createdAt: workLog.createdAt,
      updatedAt: workLog.updatedAt
    };
  }
  
  // Group multiple entries for the same employee on the same day
  export function groupWorkLogs(workLogs: WorkLog[]): EnhancedWorkLog[] {
    const groupedMap = new Map<string, EnhancedWorkLog>();
    
    workLogs.forEach(workLog => {
      // Create a unique key for each employee's daily record
      const key = `${workLog.employeeId}_${workLog.date}`;
      
      if (!groupedMap.has(key)) {
        // Create a new enhanced work log
        groupedMap.set(key, {
          id: workLog.id.split('_')[0] || workLog.id,
          date: workLog.date,
          employeeId: workLog.employeeId,
          employeeCode: workLog.employeeCode,
          employeeName: workLog.employeeName,
          department: workLog.department,
          cardNumber: workLog.cardNumber,
          workingTime: workLog.workingTime,
          entries: [],
          status: workLog.status,
          createdAt: workLog.createdAt,
          updatedAt: workLog.updatedAt
        });
      }
      
      // Add the entry
      const enhancedLog = groupedMap.get(key)!;
      enhancedLog.entries.push({
        id: workLog.id.includes('_') ? workLog.id.split('_')[1] : `entry${enhancedLog.entries.length + 1}`,
        bagCode: workLog.bagCode,
        operationCode: workLog.operationCode,
        operationName: workLog.operationName,
        hourlyTarget: workLog.hourlyTarget,
        production: workLog.production,
        totalProduction: workLog.totalProduction,
        performanceReason: workLog.performanceReason
      });
      
      // Update the last modified date if needed
      const workLogDate = new Date(workLog.updatedAt).getTime();
      const enhancedDate = new Date(enhancedLog.updatedAt).getTime();
      if (workLogDate > enhancedDate) {
        enhancedLog.updatedAt = workLog.updatedAt;
      }
    });
    
    return Array.from(groupedMap.values());
  }