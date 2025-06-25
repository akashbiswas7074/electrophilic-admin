"use client";

import { useState } from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { deleteWebsiteLogo } from "@/lib/database/actions/website.logo.actions";

interface DeleteLogoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logoId: string | null;
  onLogoDeleted: () => void;
}

export default function DeleteLogoDialog({
  open,
  onOpenChange,
  logoId,
  onLogoDeleted,
}: DeleteLogoDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle logo deletion
  const handleDeleteLogo = async () => {
    if (!logoId) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteWebsiteLogo(logoId);
      
      if (result.success) {
        onLogoDeleted();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete logo",
          variant: "destructive",
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast({
        title: "Error",
        description: "Failed to delete logo",
        variant: "destructive",
      });
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the logo from your website. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDeleteLogo();
            }}
            className="bg-destructive text-destructive-foreground"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}