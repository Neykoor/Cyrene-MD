export interface TikwmSearchAuthor {
  id?: string;
  unique_id?: string;
  nickname?: string;
  avatar?: string;
}

export interface TikwmSearchMusicInfo {
  title?: string;
  author?: string;
  play?: string;
}

export interface TikwmSearchImage {
  url?: string;
  display_image?: { url_list?: string[] };
}

export interface TikwmSearchVideoItem {
  video_id?: string;
  aweme_id?: string;
  title?: string;
  hdplay?: string;
  play?: string;
  wmplay?: string;
  images?: Array<string | TikwmSearchImage>;
  cover?: string;
  origin_cover?: string;
  duration?: number | string;
  digg_count?: number | string;
  comment_count?: number | string;
  share_count?: number | string;
  play_count?: number | string;
  download_count?: number | string;
  create_time?: number | string;
  music?: string;
  music_info?: TikwmSearchMusicInfo;
  author?: TikwmSearchAuthor;
}

export interface TikwmSearchAPIResponse {
  code: number;
  msg?: string;
  data?: {
    videos?: TikwmSearchVideoItem[];
    cursor?: number | string;
    hasMore?: boolean;
  };
}


export interface TiktokSearchResultAuthor {
  id: string | null;
  uniqueId: string | null;
  nickname: string;
  avatar: string | null;
}

export interface TiktokSearchResultMusic {
  title: string | null;
  author: string | null;
  url: string | null;
}

export interface TiktokSearchResultStatistics {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  playCount: number;
  downloadCount: number;
}

export interface TiktokSearchResultItem {
  id: string | null;
  type: 'video' | 'slideshow';
  desc: string;
  videoUrl: string | null;
  videoUrlWatermarked: string | null;
  images: string[] | null;
  cover: string | null;
  duration: number;
  statistics: TiktokSearchResultStatistics;
  createTime: string | null;
  music: TiktokSearchResultMusic;
  author: TiktokSearchResultAuthor;
  postUrl: string | null;
}

export type TiktokSearchResponse = {
  error?: string;
  query: string;
  data: TiktokSearchResultItem[] | null;
  totalResults: number;
  hasMore: boolean;
  cursor: string;
};
