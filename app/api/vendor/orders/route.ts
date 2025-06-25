import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";
import Order from "@/lib/database/models/order.model";

interface OrderItem {
  product: string;
  price: number;
  quantity: number;
}

interface OrderData {
  _id: string;
  orderId: string;
  user: {
    name?: string;
    email: string;
  };
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'vendor') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query to find orders containing vendor's products
    const query: any = {
      'items.vendor': session.user.id
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get orders with pagination
    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Filter and transform orders to only show vendor's items
    const transformedOrders = orders.map((order: any) => {
      const vendorItems = order.items.filter((item: any) => 
        item.vendor?.toString() === session.user.id
      );

      const vendorTotal = vendorItems.reduce((sum: number, item: any) => 
        sum + (item.price * item.quantity), 0
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        customer: {
          name: order.user?.name || 'Unknown',
          email: order.user?.email || 'Unknown'
        },
        items: vendorItems.map((item: any) => ({
          product: {
            _id: item.product?._id,
            name: item.product?.name || 'Unknown Product'
          },
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        vendorTotal,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}