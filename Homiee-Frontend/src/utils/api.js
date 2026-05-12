export function getResponseData(response) {
  return response?.data ?? null;
}

export function getPagedItems(response) {
  return response?.data?.data ?? [];
}

export function getPagedMeta(response) {
  const data = response?.data;
  const page = data?.page ?? 1;
  const pageSize = data?.pageSize ?? 10;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? Math.ceil(totalCount / pageSize);
  
  return {
    totalCount,
    page,
    pageSize,
    totalPages: totalPages || 1,
  };
}
