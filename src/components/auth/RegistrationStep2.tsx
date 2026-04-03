
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, Search, Building, MapPin, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface Institution {
  id: string;
  institution_name: string;
  city: string;
  district: string;
  state: string;
  udise_code: string;
  institution_type: string;
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(
    data.institutionId ? {
      id: data.institutionId,
      institution_name: data.institutionName || '',
      city: '', district: '', state: '', udise_code: '',
      institution_type: '', institution_category: '', management_type: ''
    } : null
  );
  const [showResults, setShowResults] = useState(false);
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [manualSchoolName, setManualSchoolName] = useState('');
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const [newSchoolForm, setNewSchoolForm] = useState({
    institutionName: '', city: '', state: '', contactInfo: '',
    additionalDetails: '', institutionType: 'School', managementType: 'Private'
  });

  useEffect(() => {
    if (searchQuery.length >= 2) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => searchInstitutions(searchQuery), 300);
    } else {
      setInstitutions([]);
      setShowResults(false);
      setSearchError(null);
    }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  const searchInstitutions = async (query: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const { data: results, error } = await supabase
        .from('schools')
        .select('*')
        .or(`institution_name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(20);

      if (error) throw error;

      setInstitutions((results || []).map(r => ({
        id: r.id,
        institution_name: r.institution_name,
        city: r.city || '',
        district: r.district || '',
        state: r.state || '',
        udise_code: r.udise_code || '',
        institution_type: r.institution_type || '',
        institution_category: r.institution_category || '',
        management_type: r.management_type || '',
      })));
      setShowResults(true);
    } catch (error) {
      console.error('Institution search failed:', error);
      setSearchError('Could not search institutions. You can enter your school name manually below.');
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInstitutionSelect = (institution: Institution) => {
    setSelectedInstitution(institution);
    setSearchQuery(institution.institution_name);
    setManualSchoolName('');
    setShowResults(false);
  };

  const handleSubmitNewSchool = async () => {
    if (!newSchoolForm.institutionName || !newSchoolForm.city || !newSchoolForm.state) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setIsSubmittingRequest(true);
    try {
      const { error } = await supabase.from('school_requests').insert({
        institution_name: newSchoolForm.institutionName,
        city: newSchoolForm.city,
        state: newSchoolForm.state,
        contact_info: newSchoolForm.contactInfo,
        additional_details: newSchoolForm.additionalDetails,
        institution_type: newSchoolForm.institutionType,
        management_type: newSchoolForm.managementType,
        requested_by: data.email || 'unknown@example.com',
      });

      if (error) throw error;

      toast({ title: "Request Submitted", description: "Your school request has been submitted for review." });
      setShowAddSchoolModal(false);
      setManualSchoolName(newSchoolForm.institutionName);
      setSelectedInstitution(null);
      setNewSchoolForm({ institutionName: '', city: '', state: '', contactInfo: '', additionalDetails: '', institutionType: 'School', managementType: 'Private' });
    } catch (error) {
      console.error('New school request failed:', error);
      setManualSchoolName(newSchoolForm.institutionName);
      toast({ title: "Request couldn't be sent", description: "You can still proceed with registration.", variant: "default" });
      setShowAddSchoolModal(false);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleNext = () => {
    if (selectedInstitution) {
      onNext({ institutionId: selectedInstitution.id, institutionName: selectedInstitution.institution_name });
    } else if (manualSchoolName.trim()) {
      onNext({ institutionId: null, institutionName: manualSchoolName.trim() });
    } else {
      toast({ title: "School Required", description: "Please select or enter your school name.", variant: "destructive" });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedInstitution(null);
    setInstitutions([]);
    setShowResults(false);
    setSearchError(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Select Your Institution</h3>
        <p className="text-muted-foreground">Search for your school, college, or university below</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="search" className="flex items-center space-x-2">
          <Search className="w-4 h-4" /><span>Search Institution</span>
        </Label>
        <div className="relative">
          <Input
            id="search"
            placeholder="Type your institution name or city"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          {isSearching && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {searchQuery && (
          <button onClick={clearSearch} className="text-sm text-muted-foreground hover:text-foreground">Clear search</button>
        )}
      </div>

      {searchError && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          {searchError}
        </div>
      )}

      {(searchError || (showResults && institutions.length === 0 && !isSearching)) && (
        <div className="space-y-2">
          <Label htmlFor="manualSchool">Enter School Name Manually</Label>
          <Input
            id="manualSchool"
            placeholder="e.g. Delhi Public School, R.K. Puram"
            value={manualSchoolName}
            onChange={(e) => { setManualSchoolName(e.target.value); setSelectedInstitution(null); }}
          />
        </div>
      )}

      {selectedInstitution && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Building className="w-5 h-5 text-primary mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold">{selectedInstitution.institution_name}</h4>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedInstitution.city}</span>
                  {selectedInstitution.state && <span>, {selectedInstitution.state}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showResults && institutions.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <Label className="text-sm font-medium">Search Results</Label>
          {institutions.map((institution) => (
            <Card key={institution.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleInstitutionSelect(institution)}>
              <CardContent className="p-3">
                <h4 className="font-medium text-sm">{institution.institution_name}</h4>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{institution.city}, {institution.state}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showResults && institutions.length === 0 && !isSearching && !searchError && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Building className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground mb-4">No institutions found for "{searchQuery}"</p>
            <Dialog open={showAddSchoolModal} onOpenChange={setShowAddSchoolModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Request to Add School</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Request New Institution</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Institution Name *</Label>
                    <Input placeholder="Enter institution name" value={newSchoolForm.institutionName} onChange={(e) => setNewSchoolForm(prev => ({ ...prev, institutionName: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input placeholder="City" value={newSchoolForm.city} onChange={(e) => setNewSchoolForm(prev => ({ ...prev, city: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input placeholder="State" value={newSchoolForm.state} onChange={(e) => setNewSchoolForm(prev => ({ ...prev, state: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Details</Label>
                    <Textarea placeholder="Any additional information" value={newSchoolForm.additionalDetails} onChange={(e) => setNewSchoolForm(prev => ({ ...prev, additionalDetails: e.target.value }))} rows={3} />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSubmitNewSchool} disabled={isSubmittingRequest} className="flex-1">
                      {isSubmittingRequest ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Submit Request
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddSchoolModal(false)} disabled={isSubmittingRequest}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <Button onClick={handleNext} disabled={isLoading || (!selectedInstitution && !manualSchoolName.trim())} className="min-w-32">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <>Next Step<ArrowRight className="w-4 h-4 ml-2" /></>}
        </Button>
      </div>
    </div>
  );
};
