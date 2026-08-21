export const getSearchParams = ({
  keyword,
  count,
  cursor,
  hd,
}: {
  keyword: string;
  count: number;
  cursor: number;
  hd: boolean;
}) => ({
  keywords: keyword,
  count,
  cursor,
  hd: hd ? 1 : 0,
});
