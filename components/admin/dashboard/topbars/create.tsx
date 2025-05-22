"use client";

import { useForm } from "@mantine/form";
import { useState } from "react";

import {
  TextInput,
  Button,
  Box,
  LoadingOverlay,
  ColorInput,
} from "@mantine/core";
import "@mantine/dates/styles.css";
import { createTopBar } from "@/lib/database/actions/admin/topbar/topbar.actions";

const CreateTopBar = ({ setTopBar }: { setTopBar: any }) => {
  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm({
    initialValues: {
      name: "",
      color: "",
      btnText: "",
      btnColor: "",
      btnLink: "",
    },
    validate: {
      name: (value) =>
        value.length < 5 ? "TopBar name must be at least 5 characters." : null,
    },
  });
  const submitHandler = async (values: typeof form.values) => {
    try {
      setLoading(true);
      await createTopBar(
        values.name,
        values.color,
        values.btnText,
        values.btnColor,
        values.btnLink
      )
        .then((res) => {
          if (res?.success) {
            setTopBar(res?.topbars);
            form.reset();
            alert(res?.message);
            setLoading(false);
          } else {
            alert(res?.message);
          }
        })
        .catch((err) => {
          alert("Error" + err);
          setLoading(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error: any) {
      console.log(error);
    }
  };
  return (
    <div>
      <Box pos={"relative"}>
        {loading && (
          <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
          />
        )}
        <form onSubmit={form.onSubmit(submitHandler)}>
          <div className="titleStyle">Create a TopBar</div>
          <TextInput
            label="topBar title"
            placeholder="TopBar text"
            {...form.getInputProps("name")}
          />

          <ColorInput
            label="Color"
            placeholder="Background Color of TopBar"
            {...form.getInputProps("color")}
          />
          {/* btnText */}
          <TextInput
            label="BtnText"
            placeholder="Btn Text"
            {...form.getInputProps("btnText")}
          />
          {/* btnColor */}
          <ColorInput
            label="BtnColor"
            placeholder="Btn Color"
            {...form.getInputProps("btnColor")}
          />

          {/*       btnLink */}
          <TextInput
            label="BtnLink"
            placeholder="Btn Link"
            {...form.getInputProps("btnLink")}
          />

          <Button type="submit">Add TopBar</Button>
        </form>
      </Box>
    </div>
  );
};
export default CreateTopBar;
