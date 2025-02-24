import { DataTable } from "@/components/common/table/data-table";
import React from "react";
import { columns, HandbagProductionProcess } from "./_components/columns";
import HandbagStageForm from "./_components/form";
import { fetchAllHandbagStages } from "@/actions/admin/handbag";

const HandbagStageContainer = async () => {
 const { handbagStages } = await fetchAllHandbagStages();

  // Ensure id is a string
  const formattedHandbagStages = handbagStages?.map(stage => ({
    ...stage,
    id: stage.id.toString(),
  })) || [];


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-white dark:bg-gray-900">
      <div className="grid md:grid-cols-4 gap-2"></div>
      {Array.isArray(handbagStages) && handbagStages.length > 0 && (
        <DataTable<HandbagProductionProcess, "id">
          title="Quy trình sản xuất túi xách"
          columns={columns}
          data={formattedHandbagStages}
          createFormComponent={<HandbagStageForm />}
        />
      )}
    </div>
  );
};

export default HandbagStageContainer;
