// services/api.ts
import { FormData, Worker, AttendanceStatus, ProductionIssueType } from "@/common/types/worker"

// Mock data for testing
const mockWorkers: Worker[] = Array.from({ length: 20 }).map((_, index) => ({
  id: `worker-${index + 1}`,
  name: `Công nhân ${index + 1}`,
  employeeId: `CN${(index + 1).toString().padStart(3, "0")}`,
  bagId: "bag-1",
  bagName: "Túi xách mẫu A",
  processId: "process-1",
  processName: "May viền",
  colorId: "color-1",
  colorName: "Đen",
  attendanceStatus: AttendanceStatus.PRESENT,
  hourlyData: {},
  totalOutput: 0,
  issues: [],
  qualityScore: 100,
}))

const mockFormData: FormData = {
  id: "form-1",
  formCode: "P11H1HB034",
  formName: "Phiếu theo dõi công đoạn - Giao chỉ tiêu cá nhân",
  date: new Date().toISOString(),
  factoryId: "factory-1",
  factoryName: "TBS GROUP",
  lineId: "line-1",
  lineName: "Dây chuyền 1",
  teamId: "team-1",
  teamName: "Tổ 1",
  groupId: "group-1",
  groupName: "Nhóm A",
  workers: mockWorkers,
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * API service for handling form data operations
 */
export const fetchFormData = async (): Promise<FormData> => {
  await delay(500)
  return { ...mockFormData }
}

export const updateWorkerHourlyData = async (
  workerId: string,
  timeSlotLabel: string,
  quantity: number,
): Promise<Worker> => {
  await delay(300)

  const worker = mockWorkers.find((w) => w.id === workerId)
  if (!worker) {
    throw new Error("Worker not found")
  }

  // Update the worker's hourly data
  worker.hourlyData = {
    ...worker.hourlyData,
    [timeSlotLabel]: quantity,
  }

  // Recalculate total output
  worker.totalOutput = Object.values(worker.hourlyData).reduce((sum, val) => sum + val, 0)

  return { ...worker }
}

export const updateWorkerAttendance = async (workerId: string, status: AttendanceStatus): Promise<Worker> => {
  await delay(300)

  const worker = mockWorkers.find((w) => w.id === workerId)
  if (!worker) {
    throw new Error("Worker not found")
  }

  worker.attendanceStatus = status

  return { ...worker }
}

export const addWorkerIssue = async (
  workerId: string,
  issue: {
    type: ProductionIssueType
    hour: number
    impact: number
    description?: string
  },
): Promise<Worker> => {
  await delay(300)

  const worker = mockWorkers.find((w) => w.id === workerId)
  if (!worker) {
    throw new Error("Worker not found")
  }

  worker.issues = [...worker.issues, issue]

  return { ...worker }
}

export const submitForm = async (): Promise<{ success: boolean }> => {
  await delay(1000)
  return { success: true }
}