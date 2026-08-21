import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: "ADMIN" | "TATUADOR" | "RECEPCION";
      estudioId: number;
    } & DefaultSession["user"];
  }

  interface User {
    rol: "ADMIN" | "TATUADOR" | "RECEPCION";
    estudioId: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rol?: "ADMIN" | "TATUADOR" | "RECEPCION";
    estudioId?: number;
  }
}
