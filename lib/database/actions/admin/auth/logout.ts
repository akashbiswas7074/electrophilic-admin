"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const logout = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("vendor_token");
    return {
      message: "Successfully logged out!",
    };
  } catch (error: any) {
    console.log(error);
  }
};

export async function logoutAdmin() {
  // Clear the adminId cookie
  cookies().delete("adminId");
  cookies().delete("adminToken");

  // Redirect to login page
  redirect("/admin/login");
}
