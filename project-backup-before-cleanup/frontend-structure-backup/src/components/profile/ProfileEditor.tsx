import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Briefcase, GraduationCap, Calendar, Globe, Linkedin, Twitter, Github, Save, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AvatarUpload } from './AvatarUpload';

interface ProfileData {
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
}

interface ProfileEditorProps {
  onClose?: () => void;
  initialData?: Partial<ProfileData>;
}

export const ProfileEditor = ({ onClose, initialData }: ProfileEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ProfileData>({
    bio: '',
    profession: '',
    company: '',
    location: '',
    graduationYear: undefined,
    interests: [],
    socialLinks: {
      linkedin: '',
      twitter: '',
      github: '',
      website: '',
    },
    isPublic: true,
    showEmail: false,
    showGradYear: true,
    ...initialData,
  });

  const [newInterest, setNewInterest] = useState('');

  // Fetch current profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${user?.id}/profile`);
      return response;
    },
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      return apiClient.put(`/api/users/${user?.id}/profile`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
      onClose?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests?.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...(prev.interests || []), newInterest.trim()],
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests?.filter(i => i !== interest) || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 60 }, (_, i) => currentYear - i + 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Profile</h2>
          <p className="text-muted-foreground">Update your information and preferences</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>Upload and crop your profile picture</CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload userId={user?.id} />
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Tell others about yourself</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                maxLength={500}
                className="min-h-[100px]"
              />
              <div className="text-xs text-muted-foreground text-right">
                {(formData.bio || '').length}/500
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  placeholder="e.g. Software Engineer"
                  value={formData.profession || ''}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="e.g. Google, Microsoft"
                  value={formData.company || ''}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. San Francisco, CA"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Select
                  value={formData.graduationYear?.toString() || ''}
                  onValueChange={(value) => handleInputChange('graduationYear', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {graduationYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Interests & Skills</CardTitle>
            <CardDescription>Add topics you're interested in or skilled at</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest or skill..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
              />
              <Button type="button" onClick={addInterest} disabled={!newInterest.trim()}>
                Add
              </Button>
            </div>

            {formData.interests && formData.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {interest}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => removeInterest(interest)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Links
            </CardTitle>
            <CardDescription>Connect your social media profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  LinkedIn
                </Label>
                <Input
                  placeholder="https://linkedin.com/in/username"
                  value={formData.socialLinks?.linkedin || ''}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-blue-400" />
                  Twitter
                </Label>
                <Input
                  placeholder="https://twitter.com/username"
                  value={formData.socialLinks?.twitter || ''}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </Label>
                <Input
                  placeholder="https://github.com/username"
                  value={formData.socialLinks?.github || ''}
                  onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  placeholder="https://yourwebsite.com"
                  value={formData.socialLinks?.website || ''}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>Control who can see your information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Public Profile</Label>
                <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
              </div>
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Email</Label>
                <p className="text-sm text-muted-foreground">Display your email on your profile</p>
              </div>
              <input
                type="checkbox"
                checked={formData.showEmail}
                onChange={(e) => handleInputChange('showEmail', e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Graduation Year</Label>
                <p className="text-sm text-muted-foreground">Display your graduation year</p>
              </div>
              <input
                type="checkbox"
                checked={formData.showGradYear}
                onChange={(e) => handleInputChange('showGradYear', e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
};