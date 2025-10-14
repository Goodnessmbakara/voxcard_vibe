
import { cn } from '@/lib/utils';

interface TrustScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const TrustScoreBadge = ({
  score,
  size = 'md',
  showLabel = true,
  className,
}: TrustScoreBadgeProps) => {
  // Validate and normalize score
  const normalizedScore = isNaN(score) || score === null || score === undefined ? 0 : Math.max(0, Math.min(100, score));
  
  // Determine color based on score
  const getColor = () => {
    if (normalizedScore >= 90) return 'bg-[#10B981]';
    if (normalizedScore >= 75) return 'bg-emerald-500';
    if (normalizedScore >= 60) return 'bg-yellow-500';
    if (normalizedScore >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs h-6 w-6',
    md: 'text-sm h-8 w-8',
    lg: 'text-base h-10 w-10',
  };

  return (
    <div className={cn('flex items-center', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center text-white font-medium',
          sizeClasses[size],
          getColor()
        )}
      >
        {Math.floor(normalizedScore / 10)}
      </div>
      {showLabel && (
        <div className="ml-2">
          <p className={cn('font-medium', size === 'sm' ? 'text-xs' : 'text-sm')}>Trust Score</p>
          <p 
            className={cn(
              'font-bold',
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
            )}
          >
            {normalizedScore}/100
          </p>
        </div>
      )}
    </div>
  );
};

export default TrustScoreBadge;
