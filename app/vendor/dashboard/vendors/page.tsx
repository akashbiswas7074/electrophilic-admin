import { getAllVendors } from "@/lib/database/actions/admin/vendor.actions";
import VendorsClient from "./vendors-client";

// Server component to fetch data
export default async function VendorsPage() {
  const data = await getAllVendors(); // This will be the vendors array or undefined
  return <VendorsClient vendors={data || []} />; // Pass data or an empty array if data is undefined
}
