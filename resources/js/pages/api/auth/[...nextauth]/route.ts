import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'OTP',
            credentials: {
                phone: { label: 'Phone', type: 'text' },
                otp: { label: 'OTP', type: 'text' },
            },
            async authorize(credentials) {
                try {
                    // Verify OTP with backend
                    const response = await fetch(`http://localhost:8000/client/verify-otp`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            phone: credentials?.phone,
                            otp: credentials?.otp,
                        }),
                    });

                    const data = await response.json();

                    if (response.ok && data) {
                        return {
                            id: data.user.id,
                            phone: data.user.phone,
                            otp: data.user.otp,
                            message: data.message,
                            // id: data.user.id,
                            // phone: data.user.phone,
                            // name: data.user.name || 'Customer',
                        };
                    }

                    return null;
                } catch (error) {
                    console.error('Authentication error:', error);
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: 'client.session.login',
        error: 'client.session.login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.user = user;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = token.user;
            return session;
        },
    },
    session: {
        strategy: 'jwt',
    },
    secret: `${import.meta.env.VITE_NEXTAUTH_SECRET}`,
});

export { handler as GET, handler as POST };
