import { TimeSheetType } from "@/schemas/timesheet";

// Mock database (for demonstration purposes only)
let timesheets: TimeSheetType[] = [];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Service for timesheet operations
 */
export const TimeSheetService = {
  /**
   * Get all timesheets with optional filters
   */
  async getAll(
    options: {
      employeeId?: string;
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ data: TimeSheetType[]; meta: { total: number } }> {
    await delay(500); // Simulate API delay

    let filtered = [...timesheets];

    // Apply filters
    if (options.employeeId) {
      filtered = filtered.filter(ts => ts.employeeId === options.employeeId);
    }

    if (options.dateFrom) {
      filtered = filtered.filter(ts => ts.date && ts.date >= options.dateFrom);
    }

    if (options.dateTo) {
      filtered = filtered.filter(ts => ts.date && ts.date <= options.dateTo);
    }

    if (options.status) {
      filtered = filtered.filter(ts => ts.status === options.status);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      meta: {
        total: filtered.length,
      },
    };
  },

  /**
   * Get timesheet by ID
   */
  async getById(id: string): Promise<TimeSheetType | null> {
    await delay(300); // Simulate API delay
    return timesheets.find(ts => ts.id === id) || null;
  },

  /**
   * Create a new timesheet
   */
  async create(data: Omit<TimeSheetType, "id" | "createdAt" | "updatedAt">): Promise<TimeSheetType> {
    await delay(800); // Simulate API delay

    // Create new timesheet with generated ID and timestamps
    const newTimesheet: TimeSheetType = {
      ...data,
      id: `ts-${Date.now()}`,
      status: data.status || "draft",
      totalHours: data.entries.reduce((sum, entry) => sum + (entry.total || 0), 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to "database"
    timesheets.push(newTimesheet);

    return newTimesheet;
  },

  /**
   * Update an existing timesheet
   */
  async update(id: string, data: Partial<TimeSheetType>): Promise<TimeSheetType> {
    await delay(800); // Simulate API delay

    // Find timesheet
    const index = timesheets.findIndex(ts => ts.id === id);
    if (index === -1) {
      throw new Error(`Timesheet with ID ${id} not found`);
    }

    // Update the timesheet
    const updatedTimesheet: TimeSheetType = {
      ...timesheets[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate total hours if entries were updated
    if (data.entries) {
      updatedTimesheet.totalHours = data.entries.reduce(
        (sum, entry) => sum + (entry.total || 0),
        0
      );
    }

    // Update in "database"
    timesheets[index] = updatedTimesheet;

    return updatedTimesheet;
  },

  /**
   * Delete a timesheet
   */
  async delete(id: string): Promise<void> {
    await delay(600); // Simulate API delay

    // Find timesheet
    const index = timesheets.findIndex(ts => ts.id === id);
    if (index === -1) {
      throw new Error(`Timesheet with ID ${id} not found`);
    }

    // Remove from "database"
    timesheets.splice(index, 1);
  },

  /**
   * Delete multiple timesheets
   */
  async deleteMany(ids: string[]): Promise<void> {
    await delay(1000); // Simulate API delay

    // Filter out timesheets to be deleted
    timesheets = timesheets.filter(ts => !ids.includes(ts.id || ''));
  },

  /**
   * Change timesheet status
   */
  async changeStatus(id: string, status: "draft" | "pending" | "approved" | "rejected"): Promise<TimeSheetType> {
    await delay(500); // Simulate API delay

    // Find timesheet
    const index = timesheets.findIndex(ts => ts.id === id);
    if (index === -1) {
      throw new Error(`Timesheet with ID ${id} not found`);
    }

    // Update status
    timesheets[index].status = status;
    timesheets[index].updatedAt = new Date().toISOString();

    return timesheets[index];
  },

  /**
   * Initialize with sample data
   */
  initWithSampleData(sampleData: TimeSheetType[]): void {
    timesheets = [...sampleData];
  },
};

// Sample data
export const sampleTimesheets: TimeSheetType[] = [
  {
    id: "ts-001",
    employeeName: "Nguyễn Văn A",
    employeeId: "EMP001",
    department: "Sản xuất",
    level: "Nhân viên",
    supervisor: "Trần Văn B",
    teamLeader: "Lê Thị C",
    shiftLeader: "Phạm Văn D",
    date: "2025-04-10",
    entries: [
      {
        id: "entry-001",
        taskCode: "T001",
        taskId: "CD001",
        taskName: "May túi xách mẫu A",
        target: "20",
        note: "100%",
        slots: { "1": true, "2": true, "3": true, "5": true, "6": true },
        reasons: { VT: false, CN: false, CL: true, MM: false },
        total: 5
      }
    ],
    status: "approved",
    totalHours: 5,
    createdAt: "2025-04-10T08:00:00Z",
    updatedAt: "2025-04-10T15:30:00Z"
  },
  {
    id: "ts-002",
    employeeName: "Trần Thị B",
    employeeId: "EMP002",
    department: "Sản xuất",
    level: "Nhân viên",
    supervisor: "Trần Văn B",
    teamLeader: "Lê Thị C",
    shiftLeader: "Phạm Văn D",
    date: "2025-04-11",
    entries: [
      {
        id: "entry-002",
        taskCode: "T002",
        taskId: "CD002",
        taskName: "May túi xách mẫu B",
        target: "15",
        note: "90%",
        slots: { "1": true, "2": true, "3": true, "4": true, "5": true, "6": true, "7": true },
        reasons: { VT: true, CN: false, CL: false, MM: false },
        total: 7
      }
    ],
    status: "pending",
    totalHours: 7,
    createdAt: "2025-04-11T08:00:00Z",
    updatedAt: "2025-04-11T16:30:00Z"
  },
  {
    id: "ts-003",
    employeeName: "Lê Văn C",
    employeeId: "EMP003",
    department: "Sản xuất",
    level: "Nhân viên",
    supervisor: "Trần Văn B",
    teamLeader: "Lê Thị C",
    shiftLeader: "Phạm Văn D",
    date: "2025-04-12",
    entries: [
      {
        id: "entry-003",
        taskCode: "T003",
        taskId: "CD003",
        taskName: "May túi xách mẫu C",
        target: "18",
        note: "95%",
        slots: { "1": true, "2": true, "5": true, "6": true },
        reasons: { VT: false, CN: true, CL: false, MM: false },
        total: 4
      }
    ],
    status: "draft",
    totalHours: 4,
    createdAt: "2025-04-12T08:00:00Z",
    updatedAt: "2025-04-12T12:30:00Z"
  }
];

// Initialize service with sample data
TimeSheetService.initWithSampleData(sampleTimesheets);