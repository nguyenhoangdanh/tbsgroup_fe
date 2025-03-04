"use client";

import { getUserProfileQueryFn } from "@/apis/user/user.api";
import { useQuery } from "@tanstack/react-query";

const useAuth = () => {
  const { data, ...query } = useQuery({
    queryKey: ["authUser"],
    queryFn: getUserProfileQueryFn,
    staleTime: Infinity,
  });

  return { user: data?.data ?? null, ...query };
};

export default useAuth;