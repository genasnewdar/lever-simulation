import { api } from "@/lib/axios";

export const getIeltsTests = async (page = 1, perPage = 10) => {
  const res = await api.get(
    `/api/admin/ielts/tests?page=${page}&per_page=${perPage}`
  );

  return res.data.tests;
};

export const getIeltsTestDetail = async (testId: string) => {
  const res = await api.get(`/api/admin/ielts/test/${testId}`);
  return res.data;
};
