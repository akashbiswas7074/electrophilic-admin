"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found with this ID" },
        { status: 404 }
      );
    }

    // Ensure both address types are objects
    if (!order.shippingAddress || typeof order.shippingAddress !== "object") {
      order.shippingAddress = {};
    }

    if (!order.deliveryAddress || typeof order.deliveryAddress !== "object") {
      order.deliveryAddress = {};
    }

    // Default address values to use when fields are missing
    const defaultAddressValues = {
      firstName: order.user?.name?.split(" ")[0] || "Guest",
      lastName: order.user?.name?.split(" ")[1] || "User",
      phoneNumber: "0000000000",
      address1: "Default Address",
      address2: "",
      city: "Default City",
      state: "Default State",
      zipCode: "000000",
      country: "Default Country",
    };

    // First, try to populate from deliveryAddress to shippingAddress for any missing fields
    const addressKeys: (keyof typeof defaultAddressValues)[] = [
      "firstName",
      "lastName",
      "phoneNumber",
      "address1",
      "address2",
      "city",
      "state",
      "zipCode",
      "country",
    ];

    for (const key of addressKeys) {
      // Fill in shippingAddress from deliveryAddress when missing
      if (
        order.deliveryAddress &&
        order.deliveryAddress[key] &&
        (!order.shippingAddress[key] || order.shippingAddress[key].trim() === "")
      ) {
        order.shippingAddress[key] = order.deliveryAddress[key];
      }

      // Fill in deliveryAddress from shippingAddress when missing
      if (
        order.shippingAddress &&
        order.shippingAddress[key] &&
        (!order.deliveryAddress[key] || order.deliveryAddress[key].trim() === "")
      ) {
        order.deliveryAddress[key] = order.shippingAddress[key];
      }

      // Apply defaults for any still-missing fields
      if (!order.shippingAddress[key] || order.shippingAddress[key].trim() === "") {
        order.shippingAddress[key] = defaultAddressValues[key];
      }

      if (!order.deliveryAddress[key] || order.deliveryAddress[key].trim() === "") {
        order.deliveryAddress[key] = defaultAddressValues[key];
      }
    }

    // Set order.orderAddress for backward compatibility
    order.orderAddress = { ...order.deliveryAddress };

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Successfully processed delivery address",
      order: order
    });
  } catch (error: any) {
    console.error("Error processing delivery address:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process delivery address" },
      { status: 500 }
    );
  }
}