import React from 'react';
import { IndianRupee } from 'lucide-react';

interface RupeeProps {
  className?: string;
  size?: number;
}

export const Rupee: React.FC<RupeeProps> = ({ 
  className = "w-3 h-3 inline-block -mt-0.5 mr-0.5", 
  size 
}) => {
  return <IndianRupee className={className} size={size} aria-hidden="true" />;
};
