import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Search, MapPin, Building, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InstitutionRequestModal } from './InstitutionRequestModal';

interface Institution {
  id: number;
  institution_name: string;
  city: string;
  state: string;
  udise_code: string;
  institution_category: string;
  management_type: string;
}

interface RegistrationStep2Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const RegistrationStep2 = ({ data, onNext, onBack, isLoading }: RegistrationStep2Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(
    data.institutionId ? { 
      id: data.institutionId, 
      institution_name: data.institutionName,
      city: '',
      state: '',
      udise_code: '',
      institution_category: '',
      management_type: ''
    } : null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const searchInstitutions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setInstitutions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/institutions/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const results = await response.json();
        setInstitutions(results);
      } else {
        toast({
          title: 'Search failed',
          description: 'Failed to search institutions. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Institution search error:', error);
      toast({
        title: 'Search error',
        description: 'An error occurred while searching. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      searchInstitutions(value);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const handleInstitutionSelect = (institution: Institution) => {
    setSelectedInstitution(institution);
    setSearchQuery(institution.institution_name);
    setInstitutions([]);
  };

  const handleNext = () => {
    if (!selectedInstitution) {
      toast({
        title: 'Institution required',
        description: 'Please select your institution to continue.',
        variant: 'destructive',
      });
      return;
    }

    onNext({
      institutionId: selectedInstitution.id,
      institutionName: selectedInstitution.institution_name,
    });
  };

  const handleRequestSuccess = () => {
    setShowRequestModal(false);
    toast({
      title: 'Request submitted',
      description: 'Your institution request has been submitted for review. We will add it to our database soon.',
    });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Find Your Institution</h3>
        <p className="text-muted-foreground">
          Search for your school or college from our database
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="institutionSearch" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Search Institution</span>
          </Label>
          <div className="relative">
            <Input
              id="institutionSearch"
              placeholder="Type your school/college name, city, or UDISE code..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {institutions.length > 0 && (
          <div className="border rounded-lg max-h-60 overflow-y-auto">
            {institutions.map((institution) => (
              <button
                key={institution.id}
                onClick={() => handleInstitutionSelect(institution)}
                className="w-full p-4 text-left hover:bg-muted/50 border-b last:border-b-0 focus:outline-none focus:bg-muted/50"
              >
                <div className="space-y-1">
                  <div className="flex items-start space-x-2">
                    <Building className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{institution.institution_name}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{institution.city}, {institution.state}</span>
                        {institution.udise_code && (
                          <span className="ml-2">UDISE: {institution.udise_code}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                        <span className="bg-muted px-2 py-1 rounded">
                          {institution.institution_category}
                        </span>
                        <span className="bg-muted px-2 py-1 rounded">
                          {institution.management_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Institution */}
        {selectedInstitution && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Building className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-primary">Selected Institution</p>
                  <p className="font-semibold">{selectedInstitution.institution_name}</p>
                  {selectedInstitution.city && selectedInstitution.state && (
                    <p className="text-sm text-muted-foreground">
                      {selectedInstitution.city}, {selectedInstitution.state}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {searchQuery.length >= 2 && institutions.length === 0 && !isSearching && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Institution not found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Can't find your institution in our database?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRequestModal(true)}
                className="space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Request to Add Institution</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="min-w-32"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button 
          type="button" 
          onClick={handleNext}
          disabled={!selectedInstitution || isLoading}
          className="min-w-32"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Institution Request Modal */}
      <InstitutionRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={handleRequestSuccess}
        userEmail={data.email}
        userName={`${data.firstName} ${data.lastName}`}
      />
    </div>
  );
};