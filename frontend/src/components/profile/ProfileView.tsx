import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Mail, 
  Globe, 
  Linkedin, 
  Twitter, 
  Github,
  MessageCircle,
  UserPlus,
  Settings
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface ProfileViewProps {
  userId: string;
  onEdit?: () => void;
  onMessage?: () => void;
  onConnect?: () => void;
}

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
  bio?: string;
  profession?: string;
  company?: string;
  location?: string;
  graduationYear?: number;
  interests?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  isPublic?: boolean;
  showEmail?: boolean;
  showGradYear?: boolean;
  joinedAt?: string;
  lastActive?: string;
  connectionStatus?: 'none' | 'pending' | 'connected';
}

export const ProfileView = ({ userId, onEdit, onMessage, onConnect }: ProfileViewProps) => {
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === userId;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${userId}/profile`);
      return response as ProfileData;
    },
    retry: 1,
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'platform_admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'school_admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'teacher': return 'bg-green-100 text-green-800 border-green-200';
      case 'alumni': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'student': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-600" />;
      case 'twitter': return <Twitter className="h-4 w-4 text-blue-400" />;
      case 'github': return <Github className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Loading skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-200 h-20 w-20"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <User className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Profile not found</h3>
                <p className="text-muted-foreground">This profile doesn't exist or is private.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.profilePictureUrl} />
                <AvatarFallback className="text-2xl">
                  {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRoleColor(profile.role)}>
                      {profile.role.replace('_', ' ')}
                    </Badge>
                    {profile.lastActive && (
                      <span className="text-sm text-muted-foreground">
                        Active {formatDistanceToNow(new Date(profile.lastActive), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-1">
                  {profile.profession && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {profile.profession}
                        {profile.company && ` at ${profile.company}`}
                      </span>
                    </div>
                  )}
                  
                  {profile.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.location}</span>
                    </div>
                  )}

                  {profile.showGradYear && profile.graduationYear && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Class of {profile.graduationYear}</span>
                    </div>
                  )}

                  {profile.showEmail && profile.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <Button onClick={onEdit} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  {onMessage && (
                    <Button onClick={onMessage} className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                  )}
                  {onConnect && profile.connectionStatus !== 'connected' && (
                    <Button 
                      variant="outline" 
                      onClick={onConnect}
                      className="flex items-center gap-2"
                      disabled={profile.connectionStatus === 'pending'}
                    >
                      <UserPlus className="h-4 w-4" />
                      {profile.connectionStatus === 'pending' ? 'Request Sent' : 'Connect'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <>
              <Separator className="my-4" />
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interests & Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <Badge key={index} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links */}
      {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
        <Card>
          <CardHeader>
            <CardTitle>Connect</CardTitle>
            <CardDescription>Find me on other platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(profile.socialLinks).map(([platform, url]) => {
                if (!url) return null;
                
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    {getSocialIcon(platform)}
                    <span className="capitalize font-medium">{platform}</span>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Since */}
      {profile.joinedAt && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-sm text-muted-foreground">
              Member since {new Date(profile.joinedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};