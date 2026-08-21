import type { TiktokPostItem } from '../getUserPosts/types';

export interface TiktokSearchResultEntry {
  type: number;
  item?: TiktokPostItem;
}

export interface TiktokSearchAPIResponse {
  cursor: string;
  data: TiktokSearchResultEntry[];
  extra?: { fatal_item_ids: unknown[]; logid: string; now: number };
  has_more: number | boolean;
  log_pb?: { impr_id: string };
  status_code: number;
  status_msg?: string;
}

export type TiktokSearchResponse = {
  error?: string;
  statusCode?: number;
  data: TiktokPostItem[] | null;
  totalResults: number;
  hasMore?: boolean;
  cursor?: string;
};
