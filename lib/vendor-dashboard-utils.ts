import prisma from '@/lib/database/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getVendorDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'vendor') {
    throw new Error('Unauthorized: Only vendors can access this data');
  }

  const vendorId = session.user.id;

  // Fetch total sales
  const salesData = await prisma.order.aggregate({
    where: {
      items: {
        some: {
          product: {
            vendorId: vendorId
          }
        }
      },
      status: 'completed'
    },
    _sum: {
      totalAmount: true
    }
  });

  // Fetch product count
  const activeProducts = await prisma.product.count({
    where: {
      vendorId: vendorId,
      isActive: true
    }
  });

  const totalProducts = await prisma.product.count({
    where: {
      vendorId: vendorId
    }
  });

  // Fetch pending orders
  const pendingOrders = await prisma.order.count({
    where: {
      items: {
        some: {
          product: {
            vendorId: vendorId
          }
        }
      },
      status: 'pending'
    }
  });

  // Calculate average rating
  const reviewsData = await prisma.review.aggregate({
    where: {
      product: {
        vendorId: vendorId
      }
    },
    _avg: {
      rating: true
    },
    _count: true
  });

  // Calculate sales growth (comparing with previous month)
  const today = new Date();
  const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const thisMonthSales = await prisma.order.aggregate({
    where: {
      items: {
        some: {
          product: {
            vendorId: vendorId
          }
        }
      },
      status: 'completed',
      createdAt: {
        gte: firstDayThisMonth
      }
    },
    _sum: {
      totalAmount: true
    }
  });

  const lastMonthSales = await prisma.order.aggregate({
    where: {
      items: {
        some: {
          product: {
            vendorId: vendorId
          }
        }
      },
      status: 'completed',
      createdAt: {
        gte: firstDayLastMonth,
        lt: firstDayThisMonth
      }
    },
    _sum: {
      totalAmount: true
    }
  });

  // Calculate products sold this month
  const productsSold = await prisma.orderItem.count({
    where: {
      product: {
        vendorId: vendorId
      },
      order: {
        status: 'completed',
        createdAt: {
          gte: firstDayThisMonth
        }
      }
    }
  });

  // Calculate orders completed
  const ordersCompleted = await prisma.order.count({
    where: {
      items: {
        some: {
          product: {
            vendorId: vendorId
          }
        }
      },
      status: 'completed',
      createdAt: {
        gte: firstDayThisMonth
      }
    }
  });

  // Fetch recent orders
  const recentOrders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          product: {
            vendorId: vendorId
          }
        }
      }
    },
    include: {
      user: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  // Calculate sales growth percentage
  const currentMonthSales = thisMonthSales._sum.totalAmount || 0;
  const previousMonthSales = lastMonthSales._sum.totalAmount || 0;
  const salesGrowth = previousMonthSales > 0
    ? Math.round((currentMonthSales - previousMonthSales) / previousMonthSales * 100)
    : 0;

  // Calculate customer satisfaction based on average rating
  const customerSatisfaction = reviewsData._avg.rating 
    ? Math.round((reviewsData._avg.rating / 5) * 100) 
    : 0;

  // Format recent orders for the dashboard
  const formattedRecentOrders = recentOrders.map(order => ({
    id: order.id,
    customerName: `${order.user.firstName} ${order.user.lastName}`,
    total: order.totalAmount,
    status: order.status,
    date: order.createdAt.toISOString(),
  }));

  return {
    totalSales: salesData._sum.totalAmount || 0,
    salesGrowth,
    activeProducts,
    totalProducts,
    pendingOrders,
    averageRating: reviewsData._avg.rating || 0,
    totalReviews: reviewsData._count || 0,
    thisMonthSales: currentMonthSales,
    productsSold,
    ordersCompleted,
    customerSatisfaction,
    recentOrders: formattedRecentOrders
  };
}