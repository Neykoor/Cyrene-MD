import axios from "axios";

interface YtdlResult {
  status: "success" | "error";
  creador: string;
  dl: string | null;
}

async function ytdl(url: string): Promise<YtdlResult> {
  const apis = [
    `https://ytdownloader.nvlgroup.my.id/audio?url=${url}&bitrate=128`,
    `https://api.dorratz.com/v2/yt-mp3?url=${url}`,
  ];

  for (const api of apis) {
    try {
      await axios.get(api);
      return { status: "success", creador: "eliasaryt", dl: api };
    } catch (e) {}
  }

  return { status: "error", creador: "eliasaryt", dl: null };
}

export = ytdl;
