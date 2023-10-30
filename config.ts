import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

export const domain: string = process.env.DOMAIN as string;
if (!domain) {
  throw new Error(
    "You must specify the domain name of this server via the DOMAIN environment variable!"
  );
}

export const httpPort: number = Number(process.env.HTTPPORT) || 80;
export const httpsPort: number = Number(process.env.HTTPSPORT) || 443;
export const publicCert: string = fs.readFileSync("./cert.pem", "utf-8");
export const privateKey: string = fs.readFileSync("./key.pem", "utf-8");
export const sessionSecret: string = process.env.SESSION_SECRET as string;
export const logFormat: string = process.env.LOGFORMAT || "dev";
export const serverPort: number = Number(process.env.PORT) || 3000;
