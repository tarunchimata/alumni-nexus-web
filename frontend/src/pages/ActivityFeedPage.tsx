import { ActivityFeed } from "@/components/social/ActivityFeed";

const ActivityFeedPage = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
        <p className="text-gray-600 mt-2">Stay updated with the latest posts and activities from your network</p>
      </div>
      
      <ActivityFeed context="global" />
    </div>
  );
};

export default ActivityFeedPage;