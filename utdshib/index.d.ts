import { Request, Response, NextFunction } from "express";
import { Strategy as SAMLStrategy } from "passport-saml";
export declare const urls: {
    metadata: string;
};
export declare class Strategy extends SAMLStrategy {
    constructor(options: any);
}
export declare function metadataRoute(strategy: any, publicCert: string): (req: Request, res: Response) => void;
export declare function ensureAuth(loginUrl: string): (req: Request, res: Response, next: NextFunction) => void;
export declare function backToUrl(defaultUrl?: string): (req: Request, res: Response) => void;
