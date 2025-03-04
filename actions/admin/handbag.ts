"use server";
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
    // const newProductionProcess = await prisma.handbag_production_process.create(
    //   {
    //     data: {
    //       code: productionProcess.code,
    //       name: productionProcess.name,
    //       target: productionProcess.target || 0,
    //     },
    //   }
    // );

    return {
      success: true,
      message: "Production process created successfully",
      // productionProcess: newProductionProcess,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create production process",
    };
  }
};

export const updateProductionProcess = async (productionProcess: any) => {
  try {
    // const updatedProductionProcess =
      // await prisma.handbag_production_process.update({
      //   where: {
      //     id: productionProcess.id,
      //   },
      //   data: {
      //     code: productionProcess.code,
      //     name: productionProcess.name,
      //     target: productionProcess.target || 0,
      //   },
      // });

    return {
      success: true,
      message: "Production process updated successfully",
      // productionProcess: updatedProductionProcess,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update production process",
    };
  }
};

export const deleteProductionProcess = async (
  id: number
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // await prisma.handbag_production_process.delete({
    //   where: {
    //     id,
    //   },
    // });

    return {
      success: true,
      message: "Production process deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to delete production process",
    };
  }
};

export const fetchAllHandbagStages = async () => {
  try {
    // const handbagStages = await prisma.handbag_production_process.findMany();
    return {
      success: true,
      // handbagStages,
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
    // const newHandbag = await prisma.handbag.create({
    //   data: handbag,
    // });
    return {
      success: true,
      message: "Handbag created successfully",
      // handbag: newHandbag,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create handbag",
    };
  }
};
