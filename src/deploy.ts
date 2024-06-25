import JSZip from "jszip";
import { createClient } from "@zeabur/zeabur-js";

const API_KEY = process.env.API_KEY || "your_api_key_here";

export const zeabur = createClient(API_KEY);

async function deployToZeabur(codes: string, name: string, language: string) {
  const convertedName = convertTitle(name);
  // 0. Create a file ends with .language
  const file = new File([codes], `index.${language}`, {
    type: "text/plain",
  });

  // 1. Compress codes to a zip with one single file
  const zip = new JSZip();

  zip.file(file.name, file);

  const content = await zip.generateAsync({ type: "blob" });
  const domain = await zeabur.deploy(content, "hkg1", convertedName);

  return domain;
}

function convertTitle(title: string) {
  return title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
}

export { deployToZeabur };
