import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      name: "Credenciales",

      credentials: {
        email: {
          label: "Correo",
          type: "email",
        },
        password: {
          label: "Contraseña",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        const usuario = await prisma.usuario.findUnique({
          where: {
            email,
          },
        });

        if (!usuario || !usuario.activo) {
          return null;
        }

        const passwordCorrecta = await bcrypt.compare(
          credentials.password,
          usuario.password,
        );

        if (!passwordCorrecta) {
          return null;
        }

        return {
          id: String(usuario.id),
          name: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          estudioId: usuario.estudioId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
        token.estudioId = user.estudioId;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as "ADMIN" | "TATUADOR" | "RECEPCION";
        session.user.estudioId = token.estudioId as number;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
