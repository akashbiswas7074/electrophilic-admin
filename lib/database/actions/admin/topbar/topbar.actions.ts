"use server";

import { connectToDatabase } from "@/lib/database/connect";
import TopBar from "@/lib/database/models/topbar.model";

// create top bar for admin
export const createTopBar = async (
  name: string,
  color: string,
  btnText: string,
  btnColor: string,
  btnLink: string
) => {
  try {
    await connectToDatabase();
    if (!name) {
      return {
        message: "Please provide name.",
        success: false,
      };
    }
    await new TopBar({
      title: name,
      color,
      "button.title": btnText,
      "button.color": btnColor,
      "button.link": btnLink,
    }).save();
    const topBars = await TopBar.find().sort({ updatedAt: -1 });
    return {
      topbars: JSON.parse(JSON.stringify(topBars)),
      success: true,
      message: "Successfully created topbar",
    };
  } catch (error: any) {
    console.log(error);
  }
};

// delete top bar for admin
export const deleteTopBar = async (topBardId: string) => {
  try {
    await connectToDatabase();
    const topBar = await TopBar.findByIdAndDelete(topBardId);
    if (!topBar) {
      return {
        message: "No Topbar found with this ID!",
        success: false,
      };
    }
    const topBars = await TopBar.find({}).sort({
      updatedAt: -1,
    });
    return {
      message: "Successfully deleted!",
      topbars: JSON.parse(JSON.stringify(topBars)),
      success: true,
    };
  } catch (error: any) {
    console.log(error);
  }
};

// update the top bar for admin
export const updateTopBar = async (
  topBarId: string,
  name: string,
  color: string,
  btnText: string,
  btnColor: string,
  btnLink: string
) => {
  try {
    await connectToDatabase();
    if (!name) {
      return {
        message: "Please provide name.",
        success: false,
      };
    }
    const topBar = await TopBar.findByIdAndUpdate(topBarId, {
      title: name,
      color,
      "button.title": btnText,
      "button.color": btnColor,
      "button.link": btnLink,
    });
    if (!topBar) {
      return {
        message: "No TopBar found with this Id.",
        success: false,
      };
    }
    const topBars = await TopBar.find().sort({ updatedAt: -1 });
    return {
      topbars: JSON.parse(JSON.stringify(topBars)),
      success: true,
      message: "Successfully updated",
    };
  } catch (error: any) {
    console.log(error);
  }
};

// get all topbars for admin
export const getAllTopBars = async () => {
  try {
    await connectToDatabase();
    const topBars = await TopBar.find().sort({ updatedAt: -1 });
    if (!topBars) {
      return {
        message: "No topbars found!",
        success: false,
      };
    }
    return {
      topbars: JSON.parse(JSON.stringify(topBars)),
      success: true,
      message: "Successfully fetched all topbars",
    };
  } catch (error: any) {
    console.log(error);
  }
};
