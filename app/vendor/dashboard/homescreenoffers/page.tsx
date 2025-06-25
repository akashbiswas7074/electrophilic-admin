"use client";
import CreateHomeScreenOffer from "@/components/admin/dashboard/homeScreenOffers/create";
import ListHomeScreenOffers from "@/components/admin/dashboard/homeScreenOffers/list";
import { getAllOffers } from "@/lib/database/actions/admin/homescreenoffers/home.screen.offers";
import React, { useEffect, useState } from "react";

const AdminHomeScreenOffers = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    const fetchAllHomeScreenOffers = async () => {
      try {
        await getAllOffers()
          .then((res) => {
            setData(res?.offers);
          })
          .catch((err) => alert(err));
      } catch (error: any) {
        alert(error);
      }
    };
    fetchAllHomeScreenOffers();
  }, []);
  return (
    <div>
      <CreateHomeScreenOffer setHomeScreenOffers={setData} />
      <ListHomeScreenOffers
        homeScreenOffers={data}
        setHomeScreenOffers={setData}
      />
    </div>
  );
};

export default AdminHomeScreenOffers;
