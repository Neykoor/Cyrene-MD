// CRÉDITOS: githu.com/ds6

import axios from "axios";
import * as cheerio from "cheerio";
import { Blob, FormData } from "formdata-node";
import { FormDataEncoder } from "form-data-encoder";
import { Readable } from "stream";

interface FunctionIdResult {
  status: boolean;
  id?: string;
  msg?: string;
}

interface NsfwResult {
  status: boolean;
  msg?: string;
  result?: {
    NSFW: boolean;
    percentage: string;
    response: string;
  };
}

class Checker {
  private base: string;
  private invokeEndpoint: string;
  private identifierPath: string;
  private headers: Record<string, string>;

  constructor() {
    this.base = "https://www.nyckel.com";
    this.invokeEndpoint = "/v1/functions";
    this.identifierPath = "/pretrained-classifiers/nsfw-identifier";
    this.headers = {
      authority: "www.nyckel.com",
      origin: this.base,
      referer: `${this.base}${this.identifierPath}`,
      "user-agent": "Postify/1.0.0",
      "x-requested-with": "XMLHttpRequest",
    };
  }

  async #getFunctionId(): Promise<FunctionIdResult> {
    try {
      const res = await axios.get(this.base + this.identifierPath, {
        headers: this.headers,
      });
      const $ = cheerio.load(res.data);
      const src = $('script[src*="embed-image.js"]').attr("src");
      const fid = src?.match(/[?&]id=([^&]+)/)?.[1];
      if (!fid) throw new Error("Function ID no encontrado.");
      return { status: true, id: fid };
    } catch (err: any) {
      return { status: false, msg: err.message };
    }
  }

  async response(buffer: Buffer, mimeType = "image/png"): Promise<NsfwResult> {
    const fn = await this.#getFunctionId();
    if (!fn.status || !fn.id) return { status: false, msg: fn.msg };

    let ext = mimeType.split("/")[1];
    if (ext === "jpeg") ext = "jpg";
    const filename = `image.${ext}`;

    const blob = new Blob([buffer], { type: mimeType });
    const form = new FormData();
    form.append("file", blob, filename);

    const encoder = new FormDataEncoder(form);
    const bodyStream = Readable.from(encoder.encode());

    const resp = await axios.post(`${this.base}${this.invokeEndpoint}/${fn.id}/invoke`, bodyStream, {
      headers: {
        ...this.headers,
        ...encoder.headers,
      },
    });

    let { labelName, confidence } = resp.data;
    if (confidence > 0.97) {
      const cap = Math.random() * (0.992 - 0.97) + 0.97;
      confidence = Math.min(confidence, cap);
    }

    const pct = (confidence * 100).toFixed(2) + "%";
    if (labelName === "Porn") {
      return {
        status: true,
        result: {
          NSFW: true,
          percentage: pct,
          response: "🔞 *NSFW detectado. Ten cuidado al compartir.*",
        },
      };
    }
    return {
      status: true,
      result: {
        NSFW: false,
        percentage: pct,
        response: "✅ *Contenido seguro.*",
      },
    };
  }
}

export = Checker;
