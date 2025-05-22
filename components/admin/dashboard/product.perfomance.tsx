"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getTopSellingProducts, sizeAnalytics } from "@/lib/database/actions/admin/analytics/analytics.actions";

interface SizeData {
  name: string;
  value: number;
}

interface ProductData {
  name: string;
  value: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#FF6384",
];

const ProductData = () => {
  const [sizeData, setSizeData] = useState<SizeData[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sizeStats, topProducts] = await Promise.all([
          sizeAnalytics(),
          getTopSellingProducts()
        ]);
        
        setSizeData(sizeStats || []);
        setTopSellingProducts(topProducts || []);
      } catch (error) {
        console.error('Error fetching product data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Responsive chart dimensions
  const getChartDimensions = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) { // mobile
        return { width: 300, height: 300, radius: 100, legendPosition: "bottom" };
      } else if (width < 1024) { // tablet
        return { width: 400, height: 400, radius: 120, legendPosition: "right" };
      }
      return { width: 500, height: 400, radius: 150, legendPosition: "right" }; // desktop
    }
    return { width: 500, height: 400, radius: 150, legendPosition: "right" }; // default
  };

  const [dimensions, setDimensions] = useState(getChartDimensions());

  useEffect(() => {
    const handleResize = () => {
      setDimensions(getChartDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full">
      <div className="text-center text-xl sm:text-2xl font-bold mb-6">Product Performance</div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Size Performance Chart */}
        <div className="w-full lg:w-1/2 p-4 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 px-4">
            Size Performance
          </h3>
          <div className="flex justify-center items-center min-h-[300px]">
            {sizeData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={dimensions.height}>
                <PieChart>
                  <Pie
                    data={sizeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={dimensions.radius}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sizeData?.map((entry: any, index: any) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout={dimensions.legendPosition === "bottom" ? "horizontal" : "vertical"} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-[300px]">
                No Data Found
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products Chart */}
        <div className="w-full lg:w-1/2 p-4 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 px-4">
            Top Selling Products
          </h3>
          <div className="flex justify-center items-center min-h-[300px]">
            {topSellingProducts?.length > 0 ? (
              <ResponsiveContainer width="100%" height={dimensions.height}>
                <PieChart>
                  <Pie
                    data={topSellingProducts}
                    cx="50%"
                    cy="50%"
                    outerRadius={dimensions.radius}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topSellingProducts?.map((entry: any, index: any) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout={dimensions.legendPosition === "bottom" ? "horizontal" : "vertical"} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-[300px]">
                No Data Found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductData;
