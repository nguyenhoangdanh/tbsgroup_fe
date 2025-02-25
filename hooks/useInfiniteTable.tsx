"use client";
import { get } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

interface IProps<T, K> {
  endpoint?: string;
  type?: string;
  mappingData: (data: T[]) => K[];
  filter?: any;
  getValues?: (data: T[]) => Record<string, any>;
  page?: number;
  order?: "desc" | "asc";
  limit?: number;
}

export const useInfiniteTable = <T, K>({
  endpoint,
  mappingData,
  filter,
  getValues,
  page = 1,
  order = "desc",
  limit = 10,
  type,
}: IProps<T, K>) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  // const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<K[]>([]);
  const [totals, setTotals] = useState<number>(0);
  const [value, setValue] = useState<Record<string, any>>({});
  const [reload, setReload] = useState<boolean>(false); // Add reload state

  const loadfilter = {
    ...filter,
    limit,
    skip: page * limit,
    order: `${order}`,
  };

  const handleLoadMore = useCallback(async () => {
    try {
      setLoading(true);
      if (type) {
        dispatch({
          type,
          //   payload: {
          //     filter: loadfilter,
          //     callback: (data: T[]) => {
          //       const rs: K[] = mappingData(data);
          //       setData(rs);
          //       setTotals(get(data, "length", 0));
          //       const val = getValues ? getValues(data) : {};
          //       setValue(val);
          //     },
          //   },
        });
      }

      if (!type && endpoint) {
        const response = await fetch(
          `${endpoint}?${new URLSearchParams(loadfilter).toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        const rs: K[] = mappingData(data);
        setData(rs);
        setTotals(get(data, "length", 0));
        const val = getValues ? getValues(data) : {};
        setValue(val);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, type]);

  useEffect(() => {
    handleLoadMore();
  }, [handleLoadMore, reload]);

  const onRefetch = () => setReload((prev) => !prev); // Function to toggle reload state

  return {
    data,
    setData,
    loading,
    handleLoadMore,
    onRefetch,
    value,
    setValue,
    getValues,
    totals,
  };
};
