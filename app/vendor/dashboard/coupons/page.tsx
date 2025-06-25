"use client";

import CreateCoupon from "@/components/admin/dashboard/coupons/create";
import ListAllVendorCoupons from "@/components/admin/dashboard/coupons/list";
import { getAllCoupons } from "@/lib/database/actions/admin/coupon/coupon.actions";
import { useEffect, useState } from "react";

const VendorCouponsPage = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchAllCoupons = async () => {
      try {
        await getAllCoupons().then((res) => {
          if (res?.success) {
            setData(res?.coupons);
            console.log(res?.coupons);
          } else {
            alert(res?.message);
            console.log(res?.message);
          }
        });
      } catch (error: any) {
        console.log(error);
      }
    };
    fetchAllCoupons();
  }, []);
  return (
    <div className="container">
      <CreateCoupon setCoupons={setData} />
      <ListAllVendorCoupons coupons={data} setCoupons={setData} />
    </div>
  );
};
export default VendorCouponsPage;
