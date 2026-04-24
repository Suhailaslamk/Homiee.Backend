export function getResponseData(response) {
  return response?.data ?? null;
}

export function getPagedItems(response) {
  return response?.data?.data ?? [];
}

export function getPagedMeta(response) {
  return {
    totalCount: response?.data?.totalCount ?? 0,
    page: response?.data?.page ?? 1,
    pageSize: response?.data?.pageSize ?? 10,
  };
}
