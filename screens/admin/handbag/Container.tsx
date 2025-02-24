import { DataTable } from "@/components/common/table/data-table";
import React from "react";
import { columns, Handbag } from "./_components/columns";

const HandbagContainer = () => {
  const data: Handbag[] = [
    {
      id: "1",
      code: "code1",
      stageCode: "stageCode1",
      name: "name1",
    },
    {
      id: "2",
      code: "code2",
      stageCode: "stageCode2",
      name: "name2",
    },
    {
      id: "3",
      code: "code3",
      stageCode: "stageCode3",
      name: "name3",
    },
    {
      id: "4",
      code: "code4",
      stageCode: "stageCode4",
      name: "name4",
    }
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-white dark:bg-gray-900">
      <div className="grid md:grid-cols-4 gap-2"></div>
      <DataTable title="Túi xách" columns={columns} data={data} />
    </div>
  );
};

export default HandbagContainer;
