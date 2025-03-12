"use client"
import React, { useMemo } from "react";
import { User, DollarSign, ShoppingCart, CreditCard } from "lucide-react";
import { DataTable } from "@/components/common/table/data-table";
import { DashboardCardComponent } from "./_components/DashboardCard";
import { columns, Payment } from "./_components/columns";
import { useTheme } from "next-themes";

// Move data outside component to prevent recreation on each render
const CARD_ITEMS = [
  {
    title: "Tổng người dùng",
    description: "Số lượng người dùng đăng ký",
    data: "1,000",
    icon: User,
    color: "bg-red-200",
    bgdark: "bg-red-900",
  },
  {
    title: "Doanh thu",
    description: "Tổng doanh thu tháng này",
    data: "$8,543",
    icon: DollarSign,
    color: "bg-green-200",
    bgdark: "bg-green-900",
  },
  {
    title: "Đơn hàng",
    description: "Số đơn hàng trong tháng",
    data: "124",
    icon: ShoppingCart,
    color: "bg-yellow-200",
    bgdark: "bg-yellow-900",
  },
  {
    title: "Thanh toán",
    description: "Số giao dịch thành công",
    data: "98",
    icon: CreditCard,
    color: "bg-violet-200",
    bgdark: "bg-violet-900",
  },
  // Thêm card mẫu để kiểm tra xuống dòng
  {
    title: "Card Thêm",
    description: "Card thêm để kiểm tra xuống dòng",
    data: "42",
    icon: CreditCard,
    color: "bg-blue-200",
    bgdark: "bg-blue-900",
  },
];

const PAYMENT_DATA: Payment[] = [
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
  // Sử dụng next-themes thay vì quản lý theme thủ công
  const { theme } = useTheme();

  // Memoize cards để tránh render lại không cần thiết
  // Sử dụng flex thay vì grid để có thể tự động xuống dòng khi cần
  const dashboardCards = useMemo(() => (
    <div className="flex flex-wrap gap-4">
      {CARD_ITEMS.map((item, index) => (
        <div
          key={`dash-card-${index}`}
          className="flex-grow basis-64 max-w-xs min-w-60"
        >
          <DashboardCardComponent
            {...item}
            theme={theme}
          />
        </div>
      ))}
    </div>
  ), [theme]);

  // Memoize table để tránh render lại không cần thiết
  const recentPaymentsTable = useMemo(() => (
    <DataTable
      title="Thanh toán gần đây"
      description="Danh sách các giao dịch thanh toán gần đây trong hệ thống."
      columns={columns}
      data={PAYMENT_DATA}
      actions={['read-only']}
      searchColumn="fullName"
      searchPlaceholder="Tìm kiếm email..."
      exportData={true}
      initialPageSize={5}
    />
  ), []);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 pb-8">
      {dashboardCards}
      {recentPaymentsTable}
    </div>
  );
};

export default React.memo(AdminDashboardContainer);