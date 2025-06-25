import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  role?: string;
  [key: string]: any; // Allow for additional properties
}

export const signJwtToken = async (payload: TokenPayload): Promise<string> => {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET or NEXTAUTH_SECRET must be defined in environment variables');
  }
  
  return jwt.sign(
    payload,
    secret,
    { expiresIn: '7d' }
  );
};

export const verifyJwtToken = async (token: string): Promise<TokenPayload | null> => {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret || !token) {
    return null;
  }
  
  try {
    const payload = jwt.verify(token, secret);
    return payload as TokenPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = cookies();
  const adminToken = cookieStore.get("adminToken")?.value;
  
  if (!adminToken) {
    return false;
  }
  
  try {
    // Verify the admin token (use your actual secret)
    const secret = process.env.JWT_SECRET || "your-fallback-secret";
    const decoded = jwt.verify(adminToken, secret);
    return !!decoded;
  } catch (error) {
    return false;
  }
}

export function getAdminIdFromRequest(request: NextRequest) {
  const adminToken = request.cookies.get("adminToken")?.value;
  if (!adminToken) return null;
  
  try {
    const secret = process.env.JWT_SECRET || "your-fallback-secret";
    const decoded = jwt.verify(adminToken, secret) as { adminId: string };
    return decoded.adminId;
  } catch (error) {
    return null;
  }
}