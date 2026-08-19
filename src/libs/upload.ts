import fs from "fs";
import FormData from "form-data";
import axios from "axios";
import path from "path";

interface UploadSuccess {
  status: true;
  creator: string;
  result: {
    hash: string;
    name: string;
    url: string;
    size: number;
    expiry: string;
  };
}

interface UploadFailure {
  status: false;
  message: string;
}

async function quAx(filePath: string): Promise<UploadSuccess | UploadFailure> {
  try {
    const file = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append("files[]", file, path.basename(filePath));

    const response = await axios.post("https://qu.ax/upload.php", formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (response.data.success) {
      const fileData = response.data.files[0];
      return {
        status: true,
        creator: "EliasarYT",
        result: {
          hash: fileData.hash,
          name: fileData.name,
          url: fileData.url,
          size: fileData.size,
          expiry: fileData.expiry,
        },
      };
    }
    return { status: false, message: "Error al subir el archivo" };
  } catch (error: any) {
    return { status: false, message: error.message };
  }
}

export = quAx;
