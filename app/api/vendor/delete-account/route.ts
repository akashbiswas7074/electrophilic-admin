import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Vendor from "@/lib/database/models/vendor.model";
import Product from "@/lib/database/models/product.model";
import Order from "@/lib/database/models/order.model";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== 'vendor') {
      return NextResponse.json({ error: "Access denied. Vendor role required." }, { status: 403 });
    }

    await connectToDatabase();

    const vendorId = currentUser.id;

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ 
        success: false, 
        message: "Vendor not found" 
      }, { status: 404 });
    }

    // Start transaction to ensure data consistency
    const session = await Vendor.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Delete all products associated with this vendor
        await Product.deleteMany({
          $or: [
            { vendorId: vendorId },
            { vendor: vendorId }
          ]
        }).session(session);

        // Update orders to mark vendor products as deleted
        // (Don't delete orders as they might be needed for records)
        await Order.updateMany(
          {
            $or: [
              { "products.vendorId": vendorId },
              { "orderItems.vendorId": vendorId }
            ]
          },
          {
            $set: {
              "products.$[elem].vendorDeleted": true,
              "orderItems.$[elem].vendorDeleted": true
            }
          },
          {
            arrayFilters: [
              {
                $or: [
                  { "elem.vendorId": vendorId },
                  { "elem.vendor": vendorId }
                ]
              }
            ]
          }
        ).session(session);

        // Finally, delete the vendor account
        await Vendor.findByIdAndDelete(vendorId).session(session);
      });

      return NextResponse.json({
        success: true,
        message: "Account deleted successfully"
      });

    } catch (transactionError) {
      console.error('Transaction failed:', transactionError);
      return NextResponse.json({
        success: false,
        message: "Failed to delete account due to transaction error"
      }, { status: 500 });
    } finally {
      await session.endSession();
    }

  } catch (error: any) {
    console.error('Error deleting vendor account:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to delete account" 
      }, 
      { status: 500 }
    );
  }
}