import { ProfileEditor } from "@/components/profile/ProfileEditor";

const ProfileEdit = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-600 mt-2">Update your profile information and preferences</p>
      </div>

      <ProfileEditor />
    </div>
  );
};

export default ProfileEdit;