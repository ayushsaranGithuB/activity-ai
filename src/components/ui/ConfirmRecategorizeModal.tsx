import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

const ConfirmRecategorizeModal: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="max-w-md">
        <SheetHeader>
          <SheetTitle>Recategorize All Activities</SheetTitle>
          <SheetDescription>
            Use AI to recategorize all your existing activities. This may take a
            few minutes.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will run the AI recategorization over all logged activities
              and update their categories. Do you want to continue?
            </p>

            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-primary text-primary-foreground"
              >
                Yes, Recategorize
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter />
      </SheetContent>
    </Sheet>
  );
};

export default ConfirmRecategorizeModal;
