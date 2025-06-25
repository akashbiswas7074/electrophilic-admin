"use client";
import { Button } from "@mantine/core";
import { Trash } from "lucide-react";
import { useState } from "react";

const DeleteReviewButton = ({ reviewId }: { reviewId: string }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // Confirm before deleting
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/admin/reviews/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        // Reload the page to refresh the reviews list
        window.location.reload();
      } else {
        alert(data.message || "Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("An error occurred while deleting the review");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      size="xs"
      color="red"
      variant="outline"
      leftSection={<Trash size={14} />}
      onClick={handleDelete}
      loading={isDeleting}
      aria-label="Delete review"
    >
      Delete
    </Button>
  );
};

export default DeleteReviewButton;