import React from "react";
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-black p-6 rounded shadow-lg min-w-[320px] max-w-md">
        <h3 className="text-lg font-bold mb-2">Recategorize All Activities</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use AI to recategorize all your existing activities. This may take a
          few minutes.
        </p>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This will run the AI recategorization over all logged activities and
            update their categories. Do you want to continue?
          </p>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-primary text-primary-foreground border"
            >
              Yes, Recategorize
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRecategorizeModal;
