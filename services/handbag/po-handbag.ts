import dayjs from "dayjs";

export interface IPoHandbagTableRowData {
  id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface IPoHandbag {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class PoHandbagService {
  private static instance: PoHandbagService;

  static getInstance(): PoHandbagService {
    if (!this.instance) {
      this.instance = new PoHandbagService();
    }
    return this.instance;
  }

  // ---------------------------------------------------
  mappingDataToTable(data: IPoHandbag[]): IPoHandbagTableRowData[] {
    console.log("data", data);
    return data.map((record) => ({
      id: record.code,
      code: record.code,
      name: record.name,
      created_at: dayjs(record.createdAt).format("DD/MM/YYYY"),
      updated_at: dayjs(record.updatedAt).format("DD/MM/YYYY"),
    }));
  }
}
