"use client";
import { DataTable } from "@/components/common/table/data-table";
import React from "react";
import { columns } from "./_components/columns";
import HandbagStageForm from "./_components/form";
import { deleteProductionProcess } from "@/actions/admin/handbag";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useDispatchType } from "@/lib/dispatch.utils";

const HandbagStageContainer = () => {
  const dispatch = useDispatchType();
  const { data } = useSelector((state: RootState) => state.handbagStages);

  React.useEffect(() => {
    dispatch("FETCH_PO_HANDBAG");
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-white dark:bg-gray-900">
      <div className="grid md:grid-cols-4 gap-2"></div>
      {data?.length > 0 && (
        <DataTable
          title="Quy trình sản xuất túi xách"
          columns={columns}
          data={data}
          createFormComponent={<HandbagStageForm action="create" />}
          editFormComponent={
            <>
              <div className="">Edit form</div>
            </>
          }
          onDelete={(id) => deleteProductionProcess(Number(id))}
          onEdit={(data) => {
            console.log("Edit", data);
          }}
          refetchData={() => {
            dispatch("FETCH_PO_HANDBAG");
          }}
          actions={["create", "edit", "delete"]}
        />
      )}
    </div>
  );
};

export default HandbagStageContainer;
