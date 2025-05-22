"use client";

import { useState } from "react";
import {
  Button,
  FileInput,
  TextInput,
  Image,
  SimpleGrid,
  Box,
  LoadingOverlay,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { createOffer } from "@/lib/database/actions/admin/homescreenoffers/home.screen.offers";

const fletobase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const CreateHomeScreenOffer = ({
  setHomeScreenOffers,
}: {
  setHomeScreenOffers?: any;
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm({
    initialValues: {
      title: "",
      offerType: "",
    },
    validate: {
      title: (value) =>
        value.length < 3 || value.length > 50
          ? "Offer title must be between 3 to 50 characters."
          : null,
      offerType: (value) => (!value ? "Please select an offer type." : null),
    },
  });

  const handleImageChange = async (files: File[]) => {
    const base64Images = await Promise.all(files.map(fletobase64));
    setImages(base64Images);
  };

  const submitHandler = async (values: typeof form.values) => {
    try {
      setLoading(true);
      await createOffer(values.title, values.offerType, images).then((res) => {
        if (res?.success) {
          setHomeScreenOffers(res?.offers);
          form.reset();
          setImages([]);
          alert(res?.message);
          setLoading(false);
        } else {
          setLoading(false);
          alert(res?.message);
        }
      });
    } catch (error: any) {
      alert(error);
    }
  };

  return (
    <div>
      <div className="titleStyle">Create a Home Screen Offer</div>
      <Box pos={"relative"}>
        {loading && (
          <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
          />
        )}
        <form onSubmit={form.onSubmit(submitHandler)}>
          <TextInput
            label="Title"
            placeholder="Offer title"
            {...form.getInputProps("title")}
            required
          />

          <Select
            label="Offer Type"
            placeholder="Select offer type"
            data={[
              { value: "specialCombo", label: "Special Combo" },
              { value: "crazyDeal", label: "Crazy Deal" },
            ]}
            {...form.getInputProps("offerType")}
            required
          />

          <FileInput
            label="Upload Images for Offer"
            placeholder="Choose files (800width * 671height is recommended.)"
            multiple
            accept="image/*"
            onChange={(files) => handleImageChange(files)}
            required
          />

          <SimpleGrid cols={4} spacing={"md"} mt={"md"}>
            {images.map((image, index) => (
              <Box key={index}>
                <Image
                  src={image}
                  alt={`Uploaded image ${index + 1}`}
                  width={"100%"}
                  height={"auto"}
                  fit="cover"
                />
              </Box>
            ))}
          </SimpleGrid>

          <div className="mt-[1rem]">
            <Button type="submit" className="text-white">
              Add Offer
            </Button>
          </div>
        </form>
      </Box>
    </div>
  );
};

export default CreateHomeScreenOffer;
