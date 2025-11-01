import { useState, useEffect } from "react";
import { UserCircle, Edit, Hospital, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import EditProfileDialog from "./EditProfileDialog";
import MedicalDetailsDialog from "./MedicalDetailsDialog";

const ProfileDropdown = () => {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [medicalDetailsOpen, setMedicalDetailsOpen] = useState(false);
  const [profileData, setProfileData] = useState<{ name?: string; avatar?: string }>({});

  useEffect(() => {
    const stored = localStorage.getItem("profileData");
    if (stored) {
      setProfileData(JSON.parse(stored));
    }
  }, [editProfileOpen]);

  const handleLogout = () => {
    // Future: Clerk logout
    localStorage.clear();
    window.location.href = "/signin";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full p-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileData.avatar} alt="Profile" />
              <AvatarFallback>
                {profileData.name?.charAt(0)?.toUpperCase() || <UserCircle className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-card border-border">
          <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMedicalDetailsOpen(true)}>
            <Hospital className="mr-2 h-4 w-4" />
            Medical Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      <MedicalDetailsDialog open={medicalDetailsOpen} onOpenChange={setMedicalDetailsOpen} />
    </>
  );
};

export default ProfileDropdown;
