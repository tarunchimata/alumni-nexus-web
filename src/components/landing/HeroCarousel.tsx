import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
// Replace these with your uploaded images
const heroSlide1 = "/lovable-uploads/c9d5106e-d80f-4665-b2f7-e45d1098b9b0.png"; // Mountain friends
const heroSlide2 = "/lovable-uploads/91d3c6db-5e0c-495f-88f4-8ae52c566191.png"; // Students walking  
const heroSlide3 = "/lovable-uploads/552ef61e-d182-4b65-9549-cef89ccd17b6.png"; // Students by water
const heroSlide4 = "/lovable-uploads/ced088ed-9a27-4806-933a-d020962ead8d.png"; // Students on pier
const heroSlide5 = "/lovable-uploads/9f3f4de5-d0a4-4026-9573-947e1123d93a.png"; // Students in circle

const slides = [
  {
    id: 1,
    image: heroSlide1,
    title: "Bridging Alumni and Schools",
    subtitle: "Connect graduates with current students and faculty",
    description: "Build lasting friendships and meaningful connections that span across generations of your school community."
  },
  {
    id: 2,
    image: heroSlide2,
    title: "100% Verified School Records", 
    subtitle: "Secure and authenticated institutional data",
    description: "Every school and user profile is verified through official channels, ensuring authenticity and trust in your educational network."
  },
  {
    id: 3,
    image: heroSlide3,
    title: "Secure, Role-Based Access",
    subtitle: "Protected environment with proper permissions", 
    description: "Advanced security protocols with distinct access levels for administrators, teachers, students, and alumni."
  },
  {
    id: 4,
    image: heroSlide4,
    title: "Student Community Hub",
    subtitle: "Connect, learn, and grow together",
    description: "Join your classmates in a vibrant community where education meets friendship and collaboration."
  },
  {
    id: 5,
    image: heroSlide5,
    title: "Building Lifelong Connections",
    subtitle: "Academic excellence through community",
    description: "Experience the power of collaborative learning in beautiful campus environments designed for growth."
  }
];

export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-1000 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="w-full flex-shrink-0 relative"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            
            {/* Dynamic Overlay - Enhanced for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-transparent to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Content */}
            <div className="relative h-full flex items-center justify-center">
              <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
                <div className="max-w-4xl mx-auto text-center">
                  <div className="animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight tracking-tight">
                      {slide.title}
                    </h1>
                  </div>
                  <div className="animate-in slide-in-from-bottom-4 duration-1000 delay-500">
                    <p className="text-2xl md:text-3xl lg:text-4xl text-orange-200 mb-6 font-medium leading-relaxed">
                      {slide.subtitle}
                    </p>
                  </div>
                  <div className="animate-in slide-in-from-bottom-4 duration-1000 delay-700">
                    <p className="text-xl md:text-2xl text-gray-200 mb-12 leading-relaxed max-w-3xl mx-auto">
                      {slide.description}
                    </p>
                  </div>
                  
                  <div className="animate-in slide-in-from-bottom-4 duration-1000 delay-900">
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                      <Link to="/login">
                        <Button 
                          size="lg" 
                          className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300 rounded-xl border-0"
                        >
                          Get Started
                        </Button>
                      </Link>
                      <Link to="/register">
                        <Button 
                          size="lg" 
                          className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 px-12 py-6 text-xl font-bold shadow-2xl border border-white/30 hover:border-white/50 transform hover:scale-105 transition-all duration-300 rounded-xl"
                        >
                          Join as a School
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 backdrop-blur-md border border-white/20 hover:border-white/40 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 backdrop-blur-md border border-white/20 hover:border-white/40 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide 
                ? 'w-12 h-4 bg-white shadow-lg' 
                : 'w-4 h-4 bg-white/50 hover:bg-white/75 hover:scale-110'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play Toggle */}
      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 backdrop-blur-md border border-white/20 hover:border-white/40"
        aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
      >
        <Play className={`w-5 h-5 transition-opacity duration-300 ${isAutoPlaying ? 'opacity-100' : 'opacity-50'}`} />
      </button>
    </div>
  );
};