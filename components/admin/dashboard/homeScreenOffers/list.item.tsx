import React, { useState, useRef } from "react";
import { Button, Group, Text, TextInput, Select } from "@mantine/core";
import { AiFillDelete, AiTwotoneEdit } from "react-icons/ai";
import { modals } from "@mantine/modals";

import { useRouter } from "next/navigation";
import {
  deleteOffer,
  updateOffer,
} from "@/lib/database/actions/admin/homescreenoffers/home.screen.offers";

const HomeScreenOfferListItem = ({
  offer,
  setOffers,
}: {
  offer: any;
  setOffers: any;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [title, setTitle] = useState(offer.title);
  const [offerType, setOfferType] = useState(offer.offerType);
  const input = useRef<any>(null);
  const router = useRouter();

  const handleRemoveOffer = async (offerId: string) => {
    try {
      await deleteOffer(offerId)
        .then((res) => {
          if (res?.success) {
            setOffers(res?.offers);
            alert(res?.message);
          }
        })
        .catch((err) => alert(err));
    } catch (error: any) {
      alert(error);
    }
  };

  const handleUpdateOffer = async (offerId: string) => {
    try {
      await updateOffer(offerId, title, offerType)
        .then((res) => {
          if (res?.success) {
            setOffers(res?.offers);
            alert(res?.message);
            router.refresh();
          }
        })
        .catch((err) => alert(err));
    } catch (error: any) {
      alert(error);
    }
  };

  return (
    <div>
      <li className="flex p-[10px] bg-blue-400 mt-[10px] text-white font-bold items-center justify-between">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!open}
          ref={input}
          className={
            open ? "bg-white !text-black" : "text-white bg-transparent"
          }
        />
        <Select
          value={offerType}
          onChange={setOfferType}
          data={[
            { label: "Special Combo", value: "specialCombo" },
            { label: "Crazy Deal", value: "crazyDeal" },
          ]}
          disabled={!open}
          className="ml-[1rem]"
        />
        {open && (
          <Group>
            <Button onClick={() => handleUpdateOffer(offer._id)}>Save</Button>
            <Button
              color="red"
              onClick={() => {
                setOpen(false);
                setTitle(offer.title);
                setOfferType(offer.offerType);
              }}
            >
              Cancel
            </Button>
          </Group>
        )}
        <div className="flex">
          {!open && (
            <AiTwotoneEdit
              className="w-[22px] h-[22px] cursor-pointer ml-[1rem]"
              onClick={() => {
                setOpen((prev) => !prev);
                input?.current?.focus();
              }}
            />
          )}
          <AiFillDelete
            className="w-[22px] h-[22px] cursor-pointer ml-[1rem]"
            onClick={() => {
              modals.openConfirmModal({
                title: "Delete offer",
                centered: true,
                children: (
                  <Text size="sm">
                    Are you sure you want to delete this offer? This action is
                    irreversible.
                  </Text>
                ),
                labels: {
                  confirm: "Delete offer",
                  cancel: "No, don't delete it",
                },
                confirmProps: { color: "red" },
                onCancel: () => console.log("Cancel"),
                onConfirm: () => handleRemoveOffer(offer._id),
              });
            }}
          />
        </div>
      </li>
    </div>
  );
};

export default HomeScreenOfferListItem;
