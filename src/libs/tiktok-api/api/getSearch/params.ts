import { DEFAULT_MS_TOKEN } from '../../constants/tokens';
import { generateDeviceId, generateOdinId } from '../../utils/helpers';

const LANG = 'en';

export const getSearchParams = ({
  userAgent,
  keyword,
  count,
  cursor,
  msToken,
  region,
}: {
  userAgent: string;
  keyword: string;
  count: number;
  cursor: number;
  msToken?: string;
  region: string;
}) => {
  return {
    keyword,
    count,
    cursor,
    offset: cursor,
    search_id: '',
    WebIdLastTime: Date.now(),
    aid: 1988,
    app_language: LANG,
    app_name: 'tiktok_web',
    browser_language: LANG,
    browser_name: 'Mozilla',
    browser_online: true,
    browser_platform: 'MacIntel',
    browser_version: userAgent.replace('Mozilla/', ''),
    channel: 'tiktok_web',
    cookie_enabled: true,
    data_collection_enabled: true,
    device_id: generateDeviceId(),
    device_platform: 'web_pc',
    focus_state: true,
    from_page: 'search',
    history_len: 5,
    is_fullscreen: false,
    is_page_visible: true,
    language: LANG,
    odinId: generateOdinId(),
    os: 'mac',
    priority_region: '',
    referer: '',
    region: region ?? 'GB',
    screen_height: 1080,
    screen_width: 1920,
    tz_name: 'UTC',
    user_is_login: false,
    webcast_language: LANG,
    msToken: msToken ?? DEFAULT_MS_TOKEN,
  };
};
