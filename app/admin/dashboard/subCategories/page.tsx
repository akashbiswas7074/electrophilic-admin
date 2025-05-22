"use client";

import CreateSubCategory from "@/components/admin/dashboard/sub-categories/create";
import ListAllSubCategories from "@/components/admin/dashboard/sub-categories/list";
import { getAllSubCategoriesandCategories } from "@/lib/database/actions/admin/subCategories/subcategories.actions";
import { useEffect, useState } from "react";

import React from "react";

const AdminSubCategories = () => {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState<any>();
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        await getAllSubCategoriesandCategories()
          .then((res) => {
            if (res?.success) {
              setData(res?.subCategories);
              setCategories(res?.categories);
            }
          })
          .catch((err) => alert(err));
      } catch (error: any) {
        alert(error);
      }
    };
    fetchAllCategories();
  }, []);
  return (
    <div>
      <CreateSubCategory setSubCategories={setData} categories={categories} />
      <ListAllSubCategories
        subCategories={data}
        setSubCategories={setData}
        categories={categories}
      />
    </div>
  );
};

export default AdminSubCategories;
