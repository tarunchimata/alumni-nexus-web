import { useAuth } from "@/hooks/useAuth";
import { ProfileView } from "@/components/profile/ProfileView";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Edit, Settings } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your profile information and privacy settings</p>
        </div>
        <div className="flex space-x-2">
          <Link to="/dashboard/profile/edit">
            <Button className="flex items-center">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
          <Link to="/dashboard/settings">
            <Button variant="outline" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <ProfileView userId={user.id} />
    </div>
  );
};

export default Profile;