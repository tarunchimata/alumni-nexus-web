import { Link } from "react-router-dom";
import { Users } from "lucide-react";

// Your colorful logo - replace the gradient div below with this:
const userLogo = "/lovable-uploads/cf04646c-b812-4d64-9f2c-638a08cee4ee.png";

// EASY LOGO UPDATE:
// The logo image is now set to your uploaded colorful logo
// If you want to change it later, just replace the userLogo URL above

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  linkTo?: string;
}

export const Logo = ({ size = "md", showText = true, linkTo = "/" }: LogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  };

  const LogoImage = () => (
    // Using your colorful uploaded logo
    <img 
      src={userLogo} 
      alt="My School Buddies" 
      className={`${sizeClasses[size]} rounded-xl object-contain bg-white/10 p-1`} 
    />
  );

  const content = (
    <div className="inline-flex items-center space-x-3">
      <LogoImage />
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-orange-500 via-blue-600 to-pink-600 bg-clip-text text-transparent`}>
          My School Buddies
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};