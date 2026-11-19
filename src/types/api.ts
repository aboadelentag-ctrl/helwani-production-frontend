export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  role: 'admin' | 'manager' | 'supervisor';
  departmentId: number | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  isActive: boolean;
}

export interface Shift {
  id: number;
  code: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
}

export interface Worker {
  id: number;
  code: string;
  name: string;
  departmentId: number;
  jobTitle: string | null;
  hireDate: string | null;
  phone: string | null;
  status: string;
  department?: Department;
}

export interface Equipment {
  id: number;
  code: string;
  name: string;
  departmentId: number;
  model: string | null;
  serialNumber: string | null;
  status: string;
  department?: Department;
}

export interface Task {
  id: number;
  code: string;
  name: string;
  departmentId: number;
  expectedTimeMinutes: number | null;
  standardQuantity: number | null;
  unit: string | null;
  isActive: boolean;
  department?: Department;
}

export interface DailyLog {
  id: number;
  logDate: string;
  shiftId: number;
  workerId: number;
  taskId: number;
  equipmentId: number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  quantityProduced: number | null;
  wasteQuantity: number | null;
  wasteReason: string | null;
  notes: string | null;
  status: string;
  worker?: Worker;
  task?: Task;
  equipment?: Equipment | null;
  shift?: Shift;
  grades?: TaskGrade | null;
  images?: ImageAttachment[];
}

export interface TaskGrade {
  id: number;
  dailyLogId: number;
  qualityScore: number;
  speedScore: number;
  cleanlinessScore: number;
  recipeScore: number;
  totalScore: number;
}

export interface ImageAttachment {
  id: number;
  dailyLogId: number;
  imageUrl: string;
  imageType: string | null;
  description: string | null;
}

export interface DashboardKpis {
  date: string;
  production: {
    totalLogsToday: number;
    totalProducedToday: number;
    totalWasteToday: number;
    wastePercentageToday: number;
    avgGradeToday: number;
  };
  operations: {
    activeWorkersToday: number;
    totalWorkers: number;
    attendanceRateToday: number;
  };
  maintenance: {
    openIssues: number;
  };
}

export interface DailySummary {
  date: string;
  departmentId: number | string;
  totalLogs: number;
  totalProduced: number;
  totalWaste: number;
  wastePercentage: number;
  avgGradeOutOf40: number;
  gradedCount: number;
}


export interface CreateDailyLogPayload {
  logDate: string;
  shiftId: number;
  workerId: number;
  taskId: number;
  equipmentId?: number | null;
  startTime?: string;
  endTime?: string;
  quantityProduced?: number;
  wasteQuantity?: number;
  wasteReason?: string;
  notes?: string;
  supervisorId?: number;
  status?: string;
  grades?: {
    qualityScore: number;
    speedScore: number;
    cleanlinessScore: number;
    recipeScore: number;
  };
  images?: { imageUrl: string; imageType?: string; description?: string }[];
}

export interface DailyLogWithRelations extends DailyLog {
  worker?: Worker;
  task?: Task;
  equipment?: Equipment | null;
  shift?: Shift;
  grades?: TaskGrade | null;
  images?: ImageAttachment[];
}

export interface DepartmentComparison {
  department: Department;
  totalLogs: number;
  totalProduced: number;
  totalWaste: number;
  wastePercentage: number;
  avgGradeOutOf40: number;
  gradedCount: number;
}

export interface WasteAnalysis {
  period: { startDate: string; endDate: string };
  summary: {
    totalWaste: number;
    totalProduced: number;
    wastePercentage: number;
    wasteIncidentsCount: number;
  };
  byReason: { reason: string; count: number; totalWaste: number }[];
  byDepartment: { department: string; count: number; totalWaste: number }[];
}

export interface MonthlyReport {
  period: string;
  departmentId: number | string;
  summary: {
    totalLogs: number;
    totalProduced: number;
    totalWaste: number;
    wastePercentage: number;
    avgGradeOutOf40: number;
    activeDays: number;
  };
  dailyBreakdown: {
    date: string;
    totalLogs: number;
    totalProduced: number;
    totalWaste: number;
    gradedCount: number;
    gradeSum: number;
    avgGrade: number;
  }[];
}

export interface WorkerPerformance {
  worker: { id: number; code: string; name: string; department?: string };
  period: { startDate: string; endDate: string };
  summary: {
    totalLogs: number;
    totalProduced: number;
    totalWaste: number;
    wastePercentage: number;
    attendanceRate: number;
    avgScores: {
      quality: number;
      speed: number;
      cleanliness: number;
      recipe: number;
      total: number;
    };
  };
  topTasks: { task: Task; count: number; avgGrade: number }[];
  recentLogs: DailyLogWithRelations[];
}
