"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth-helpers";

export async function checkAdminAuth() {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (!isAuthenticated) {
    redirect("/admin/login");
  }
  
  return true;
}