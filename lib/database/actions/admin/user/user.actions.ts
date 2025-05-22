"use server";

import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";

// get all users for admin
export async function getAllUsers() {
  try {
    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(users));
  } catch (error: any) {
    console.log(error);
  }
}

// delete Single user by id for admin
export async function deleteSingleUser(id: string) {
  try {
    await connectToDatabase();
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return {
        message: "User not found with this id!",
        success: false,
      };
    }
    return {
      message: "Successfully deleted user",
      success: true,
    };
  } catch (error) {
    console.log(error);
  }
}
