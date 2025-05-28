// src/types/worker.ts

import { AttendanceStatus, ProductionIssue } from './digital-form';

/**
 * Worker interface representing a factory worker in the system
 */
export interface Worker {
  id: string;
  employeeId: string; // Employee ID/code in the company system
  fullName: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  groupId?: string;
  groupName?: string;
  teamId?: string;
  teamName?: string;
  lineId?: string;
  lineName?: string;
  factoryId?: string;
  factoryName?: string;
  position?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  joinDate?: string;
  birthDate?: string;
  
  // Additional fields when worker is associated with form entry
  entryId?: string;
  bagId?: string;
  bagName?: string;
  processId?: string;
  processName?: string;
  colorId?: string;
  colorName?: string;
  attendanceStatus?: AttendanceStatus;
  totalOutput?: number;
  hourlyData?: Record<string, number>;
  plannedOutput?: number;
  qualityScore?: number;
  efficiency?: number; // Calculated as percentage of target
}

/**
 * WorkerProductionData interface for tracking daily production stats
 */
export interface WorkerProductionData {
  id: string; // Entry ID
  name: string; // Worker name
  employeeId: string; // Worker employee ID
  bagId: string; // HandBag ID
  bagName: string; // HandBag name
  processId: string; // Production process ID
  processName: string; // Production process name
  colorId: string; // Bag color ID
  colorName: string; // Bag color name
  attendanceStatus: AttendanceStatus;
  hourlyData: Record<string, number>; // Map hour intervals to output count
  totalOutput: number; // Total output for the day
  issues: ProductionIssue[]; // Any issues encountered
  qualityScore: number; // Quality rating 0-100
  plannedOutput?: number; // Target output for the day
}

/**
 * TimeSlot interface representing a time slot for production
 */
export interface TimeSlot {
  start: string; // "07:30"
  end: string; // "08:30"
  label: string; // "07:30-08:30"
  isBreak?: boolean; // Whether this is a break time
}

export interface WorkerGroup {
  id: string;
  name: string;
  code: string;
  teamId: string;
  teamName?: string;
  workerCount?: number;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  lineId: string;
  lineName?: string;
  groupCount?: number;
  workerCount?: number;
}

export interface Line {
  id: string;
  name: string;
  code: string;
  factoryId: string;
  factoryName?: string;
  teamCount?: number;
  workerCount?: number;
}

export interface Factory {
  id: string;
  name: string;
  code: string;
  lineCount?: number;
  workerCount?: number;
}
