"use server";
import { prisma } from "@/lib/prismadb";
import { appendToGoogleSheet } from "../googlesheet";
type Handbag = {
  code: string;
  name: string;
  handbag_production_process: {
    connect: {
      id: number;
    };
  };
};

export const createProductionProcess = async (productionProcess: any) => {
  try {
    const newProductionProcess = await prisma.handbag_production_process.create(
      {
        data: {
          code: productionProcess.code,
          name: productionProcess.name,
          target: productionProcess.target || 0,
        },
      }
    );

    // Prepare the data to be inserted into Google Sheets
    const values = [
      [
        newProductionProcess.code,
        newProductionProcess.name,
        newProductionProcess.target,
      ],
    ];

    // Append data to Google Sheets
    await appendToGoogleSheet(values);

    return {
      success: true,
      message: "Production process created successfully",
      productionProcess: newProductionProcess,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create production process",
    };
  }
};

export const fetchAllHandbagStages = async () => {
  try {
    const handbagStages = await prisma.handbag_production_process.findMany();
    return {
      success: true,
      handbagStages,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch handbag stages",
    };
  }
};

export const createHandbag = async (handbag: Handbag) => {
  try {
    const newHandbag = await prisma.handbag.create({
      data: handbag,
    });
    return {
      success: true,
      message: "Handbag created successfully",
      handbag: newHandbag,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create handbag",
    };
  }
};
