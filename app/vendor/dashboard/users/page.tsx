import UsersTable from "@/components/admin/dashboard/users/table";
import { getAllUsers } from "@/lib/database/actions/admin/user/user.actions";
import React from "react";

const AllUsersPage = async () => {
  const data = await getAllUsers().catch((err) => console.log(err));
  console.log(data);

  return (
    <div className="container">
      <UsersTable rows={data} />
    </div>
  );
};

export default AllUsersPage;
