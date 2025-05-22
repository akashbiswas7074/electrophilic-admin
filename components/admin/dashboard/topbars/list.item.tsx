import React, { useState } from "react";
import { TextInput, Button, Group, Text, ColorInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { AiFillDelete, AiTwotoneEdit } from "react-icons/ai";
import { modals } from "@mantine/modals";
import {
  deleteTopBar,
  updateTopBar,
} from "@/lib/database/actions/admin/topbar/topbar.actions";

// Renamed to uppercase first letter to follow React component naming convention
const TopBarListItem = ({
  topBar,
  setTopBars,
}: {
  topBar: any;
  setTopBars: any;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const form = useForm({
    initialValues: {
      name: topBar.title,
      color: topBar.color,
      btnText: topBar.button.title,
      btnColor: topBar.button.color,
      btnLink: topBar.button.link,
    },
    validate: {
      name: (value) =>
        value.length < 5 ? "TopBar name must be at least 5 characters." : null,
    },
  });
  const handleRemoveTopBar = async (topBarId: string) => {
    try {
      await deleteTopBar(topBarId)
        .then((res) => {
          if (res?.success) {
            setTopBars(res?.topbars);
            alert(res?.message);
          }
        })
        .catch((err) => alert(err));
    } catch (error: any) {
      alert(error);
    }
  };
  const handleUpdateTopBar = async (topBarId: string) => {
    try {
      const { name, color, btnText, btnColor, btnLink } = form.values;
      await updateTopBar(topBarId, name, color, btnText, btnColor, btnLink)
        .then((res) => {
          if (res?.success) {
            setTopBars(res?.topbars);
            setOpen(false);
            alert(res?.message);
          }
        })
        .catch((err) => alert(err));
    } catch (error: any) {
      alert(error);
    }
  };

  return (
    <div>
      <li className="flex p-[10px] bg-blue-400 mt-[10px] text-whit font-bold items-center justify-between  ">
        <TextInput
          value={form.values.name}
          onChange={(e) => form.setFieldValue("name", e.target.value)}
          disabled={!open}
          className={
            open ? "bg-white !text-black" : "text-white bg-transparent"
          }
        />
        {open && (
          <Group>
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
            {/*btnLink */}
            <TextInput
              label="BtnLink"
              placeholder="Btn Link"
              {...form.getInputProps("btnLink")}
            />
            <Button onClick={() => handleUpdateTopBar(topBar._id)}>Save</Button>
            <Button
              color="red"
              onClick={() => {
                setOpen(false);
                form.reset();
              }}
            >
              Cancel
            </Button>
          </Group>
        )}
        <div className="flex">
          {!open && (
            <AiTwotoneEdit
              className="w-[22px] h-[22px] cursor-pointer ml-[1rem] "
              onClick={() => {
                setOpen((prev) => !prev);
              }}
            />
          )}
          <AiFillDelete
            className="w-[22px] h-[22px] cursor-pointer ml-[1rem] "
            onClick={() => {
              modals.openConfirmModal({
                title: "Delete topBar",
                centered: true,
                children: (
                  <Text size="sm">
                    Are you sure you want to delete topBar? This action is
                    irreversible.
                  </Text>
                ),
                labels: {
                  confirm: "Delete topBar",
                  cancel: "No don't delete it",
                },
                confirmProps: { color: "red" },
                onCancel: () => console.log("Cancel"),
                onConfirm: () => handleRemoveTopBar(topBar._id),
              });
            }}
          />
        </div>
      </li>
    </div>
  );
};

export default TopBarListItem;
