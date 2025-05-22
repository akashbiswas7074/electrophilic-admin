"use client";
import { handleVerificationChange } from "@/lib/database/actions/admin/products/products.actions";
import { Switch } from "@mantine/core";
import React from "react";

const SwitchComponent = ({
  verified,
  _id,
}: {
  verified: boolean;
  _id: string;
}) => {
  return (
    <div>
      <Switch
        label="Verified"
        checked={verified}
        onChange={async (e) =>
          await handleVerificationChange(_id, e.currentTarget.checked).then(
            (res) => {
              if (res?.success) {
                alert(res?.message);
              } else {
                alert(res?.message);
              }
            }
          )
        }
      />
    </div>
  );
};

export default SwitchComponent;
