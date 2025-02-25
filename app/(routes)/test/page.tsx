"use client";
import { updateGoogleSheetCell } from "@/actions/googlesheet";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
export default function page() {
  const [sheetData, setSheetData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log("fetching data");
      const response = await fetch("/api/fetchGoogleSheetById?range=Sheet1", {
        method: "GET",
      });
      if (!response.ok) {
        console.error("Failed to fetch data");
        return;
      }
      const result = await response.json();
      console.log("result", result);
      setSheetData(result.data);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const updateCell = async () => {
      const currentDate = new Date().toLocaleDateString();
      const formatDate = dayjs(currentDate).format("DD/MM/YYYY");
      await updateGoogleSheetCell("Sheet1!F5:L5", `NGÀY ${formatDate}`);
    };
    if (sheetData) {
      updateCell();
      console.log(sheetData);
    }
  }, [sheetData]);
  return <div>page</div>;
}
