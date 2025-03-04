import React from "react";
import { User } from "lucide-react";
import { DataTable } from "@/components/common/table/data-table";
import { DashboardCardComponent } from "./_components/DashboardCard";
import { columns, Payment } from "./_components/columns";

const cardItems = [
  {
    title: "Total Users",
    description: "Total number of users",
    data: "1,000",
    icon: User,
    color: "bg-red-200",
    bgdark: "bg-red-900",
  },
  {
    title: "Total Users",
    description: "Total number of users",
    data: "1,000",
    icon: User,
    color: "bg-green-200",
    bgdark: "bg-green-900",
  },
  {
    title: "Total Users",
    description: "Total number of users",
    data: "1,000",
    icon: User,
    color: "bg-yellow-200",
    bgdark: "bg-yellow-900",
  },
  {
    title: "Total Users",
    description: "Total number of users",
    data: "1,000",
    icon: User,
    color: "bg-violet-200",
    bgdark: "bg-violet-900",
  },
];

const data: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@yahoo.com",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "Abe45@gmail.com",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "Monserrat44@gmail.com",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "Silas22@gmail.com",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@hotmail.com",
  },
];

const AdminDashboardContainer = () => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-white dark:bg-gray-900">
      <div className="grid md:grid-cols-4 gap-2">
        {cardItems.map((item, index) => (
          <DashboardCardComponent
            key={index}
            {...item}
          // theme={theme}
          />
        ))}
      </div>
      {/* <DataTable title="Payments" columns={columns} data={data} /> */}
    </div>
  );
};

export default AdminDashboardContainer;
