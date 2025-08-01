import { Link } from "react-router-dom";
import { Users } from "lucide-react";

// REPLACE YOUR LOGO HERE:
// 1. Put your logo image in src/assets/ folder (e.g., "my-logo.png")
// 2. Import it: import myLogo from "@/assets/my-logo.png";
// 3. Replace the gradient div below with: <img src={myLogo} alt="My School Buddies" className="w-12 h-12 rounded-xl object-contain" />

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
    // REPLACE THIS DIV WITH YOUR LOGO IMAGE
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center`}>
      <Users className={`${size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'} text-white`} />
    </div>
    // Example replacement:
    // <img src={myLogo} alt="My School Buddies" className={`${sizeClasses[size]} rounded-xl object-contain`} />
  );

  const content = (
    <div className="inline-flex items-center space-x-3">
      <LogoImage />
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent`}>
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