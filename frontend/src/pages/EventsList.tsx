import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, CalendarCheck, CalendarX } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  attendees: number;
  maxAttendees?: number;
  category: string;
  isRSVPed: boolean;
  image?: string;
}

const EventsList = () => {
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Alumni Networking Night",
      description: "Join us for an evening of networking with fellow alumni. Light refreshments will be provided.",
      date: "2024-02-15",
      time: "6:00 PM",
      location: "Downtown Convention Center",
      organizer: "Alumni Association",
      attendees: 45,
      maxAttendees: 100,
      category: "Networking",
      isRSVPed: false
    },
    {
      id: "2",
      title: "Career Fair 2024",
      description: "Meet with top employers and explore new career opportunities. Open to all alumni and current students.",
      date: "2024-02-28",
      time: "10:00 AM",
      location: "University Campus - Main Hall",
      organizer: "Career Services",
      attendees: 120,
      maxAttendees: 200,
      category: "Career",
      isRSVPed: true
    },
    {
      id: "3",
      title: "Class of 2019 Reunion",
      description: "Five-year reunion celebration for the Class of 2019. Dinner, drinks, and memories!",
      date: "2024-03-10",
      time: "7:00 PM",
      location: "Grand Hotel Ballroom",
      organizer: "Class of 2019 Committee",
      attendees: 78,
      maxAttendees: 150,
      category: "Reunion",
      isRSVPed: false
    },
    {
      id: "4",
      title: "Tech Talk: AI in Education",
      description: "Learn about the latest developments in AI and how they're transforming education.",
      date: "2024-01-20",
      time: "2:00 PM",
      location: "Virtual Event",
      organizer: "Tech Alumni Group",
      attendees: 200,
      category: "Education",
      isRSVPed: true
    }
  ]);

  const upcomingEvents = events.filter(event => new Date(event.date) >= new Date());
  const pastEvents = events.filter(event => new Date(event.date) < new Date());

  const handleRSVP = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            isRSVPed: !event.isRSVPed,
            attendees: event.isRSVPed ? event.attendees - 1 : event.attendees + 1
          }
        : event
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "networking": return "bg-blue-100 text-blue-800";
      case "career": return "bg-green-100 text-green-800";
      case "reunion": return "bg-purple-100 text-purple-800";
      case "education": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{event.title}</CardTitle>
            <Badge className={`mt-2 ${getCategoryColor(event.category)}`}>
              {event.category}
            </Badge>
          </div>
          {event.isRSVPed && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CalendarCheck className="w-3 h-3 mr-1" />
              RSVP'd
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-600 mb-4">{event.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(event.date)}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            {event.time}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {event.location}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            {event.attendees} attending
            {event.maxAttendees && ` (${event.maxAttendees - event.attendees} spots left)`}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Organized by {event.organizer}
          </span>
          
          {new Date(event.date) >= new Date() && (
            <Button
              onClick={() => handleRSVP(event.id)}
              variant={event.isRSVPed ? "outline" : "default"}
              size="sm"
            >
              {event.isRSVPed ? (
                <>
                  <CalendarX className="w-4 h-4 mr-1" />
                  Cancel RSVP
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4 mr-1" />
                  RSVP
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        <p className="text-gray-600 mt-2">Discover and attend alumni events, networking opportunities, and more</p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Upcoming Events ({upcomingEvents.length})</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Past Events ({pastEvents.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming events</h3>
                <p className="text-gray-500">Check back soon for new events and opportunities!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No past events</h3>
                <p className="text-gray-500">Past events you've attended will show up here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventsList;