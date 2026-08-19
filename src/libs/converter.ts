import fs from "fs";
import path from "path";
import { spawn } from "child_process";

function ffmpeg(buffer: Buffer, args: string[] = [], ext = "", ext2 = ""): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const tmp = path.join(__dirname, "../tmp/", `${+new Date()}.${ext}`);
        const out = `${tmp}.${ext2}`;
        await fs.promises.writeFile(tmp, buffer);
        spawn("ffmpeg", ["-y", "-i", tmp, ...args, out])
          .on("error", reject)
          .on("close", async (code) => {
            try {
              await fs.promises.unlink(tmp);
              if (code !== 0) return reject(code);
              resolve(await fs.promises.readFile(out));
              await fs.promises.unlink(out);
            } catch (e) {
              reject(e);
            }
          });
      } catch (e) {
        reject(e);
      }
    })();
  });
}

function toAudio(buffer: Buffer, ext: string): Promise<Buffer> {
  return ffmpeg(buffer, ["-vn", "-ac", "2", "-b:a", "128k", "-ar", "44100", "-f", "mp3"], ext, "mp3");
}

function toPTT(buffer: Buffer, ext: string): Promise<Buffer> {
  return ffmpeg(buffer, ["-vn", "-c:a", "libopus", "-b:a", "128k", "-vbr", "on", "-compression_level", "10"], ext, "opus");
}

function toVideo(buffer: Buffer, ext: string): Promise<Buffer> {
  return ffmpeg(
    buffer,
    ["-c:v", "libx264", "-c:a", "aac", "-ab", "128k", "-ar", "44100", "-crf", "32", "-preset", "slow"],
    ext,
    "mp4"
  );
}

export { toAudio, toPTT, toVideo, ffmpeg };
