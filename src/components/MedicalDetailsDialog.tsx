import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface MedicalData {
  patientId: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
}

interface MedicalDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MedicalDetailsDialog = ({ open, onOpenChange }: MedicalDetailsDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<MedicalData>({
    patientId: "",
    hospitalName: "",
    hospitalAddress: "",
    hospitalPhone: "",
  });

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem("medicalData");
      if (stored) {
        setFormData(JSON.parse(stored));
      }
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem("medicalData", JSON.stringify(formData));
    toast({
      title: "Medical details updated",
      description: "Your medical information has been saved successfully.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Medical Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient ID</Label>
            <Input
              id="patientId"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              placeholder="PID12345"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospitalName">Hospital Name</Label>
            <Input
              id="hospitalName"
              value={formData.hospitalName}
              onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
              placeholder="CityCare Hospital"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospitalAddress">Hospital Address</Label>
            <Input
              id="hospitalAddress"
              value={formData.hospitalAddress}
              onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
              placeholder="123 Main St"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospitalPhone">Hospital Phone Number</Label>
            <Input
              id="hospitalPhone"
              value={formData.hospitalPhone}
              onChange={(e) => setFormData({ ...formData, hospitalPhone: e.target.value })}
              placeholder="+91XXXXXXXXXX"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicalDetailsDialog;
