export interface HandBag {
    id: string;
    code: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    active: boolean;
    category: string | null;
    dimensions: string | null;
    material: string | null;
    weight: number | null;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface BagColor {
    id: string;
    handBagId: string;
    colorCode: string;
    colorName: string;
    hexCode: string | null;
    active: boolean;
    imageUrl: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface BagColorProcess {
    id: string;
    bagColorId: string;
    bagProcessId: string;
    standardOutput: number;
    difficulty: number | null;
    timeEstimate: number | null;
    materialUsage: any | null;
    qualityNotes: string | null;
    specialTools: string | null;
    productivity: number;
    createdAt: string;
    updatedAt: string;
  }
  
  // DTOs
  export interface HandBagCreateDTO {
    code: string;
    name: string;
    description?: string;
    imageUrl?: string;
    active?: boolean;
    category?: string;
    dimensions?: string;
    material?: string;
    weight?: number;
  }
  
  export interface HandBagUpdateDTO {
    name?: string;
    description?: string;
    imageUrl?: string;
    active?: boolean;
    category?: string;
    dimensions?: string;
    material?: string;
    weight?: number;
  }
  
  export interface HandBagCondDTO {
    code?: string;
    name?: string;
    category?: string;
    active?: boolean;
    search?: string;
  }
  
  export interface BagColorCreateDTO {
    handBagId: string;
    colorCode: string;
    colorName: string;
    hexCode?: string;
    active?: boolean;
    imageUrl?: string;
    notes?: string;
  }
  
  export interface BagColorUpdateDTO {
    colorName?: string;
    hexCode?: string;
    active?: boolean;
    imageUrl?: string;
    notes?: string;
  }
  
  export interface BagColorCondDTO {
    handBagId?: string;
    colorCode?: string;
    colorName?: string;
    active?: boolean;
    search?: string;
  }
  
  export interface BagColorProcessCreateDTO {
    bagColorId: string;
    bagProcessId: string;
    standardOutput: number;
    difficulty?: number;
    timeEstimate?: number;
    materialUsage?: any;
    qualityNotes?: string;
    specialTools?: string;
    productivity: number;
  }
  
  export interface BagColorProcessUpdateDTO {
    standardOutput?: number;
    difficulty?: number;
    timeEstimate?: number;
    materialUsage?: any;
    qualityNotes?: string;
    specialTools?: string;
    productivity?: number;
  }
  
  export interface BagColorProcessCondDTO {
    bagColorId?: string;
    bagProcessId?: string;
  }