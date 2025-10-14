import { Group } from '@/context/StacksContractProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStacksWallet } from '@/context/StacksWalletProvider';

export const PlanCard = ({ plan }: { plan: Group }) => {
  const { address: walletAddress } = useStacksWallet();
  const participants = Array.isArray(plan.participants) ? plan.participants : [];
  const address = (walletAddress || "").toLowerCase();

  const isParticipantOrAdmin =
    participants.map(addr => addr.toLowerCase()).includes(address) ||
    plan.creator?.toLowerCase() === address;

  const frequencyToText: { [key: string]: string } = {
    Daily: 'day',
    Weekly: 'week',
    Monthly: 'month',
    daily: 'day',
    weekly: 'week',
    monthly: 'month',
  };
  return (
    <Card className="ajo-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg md:text-xl">{plan.name}</CardTitle>
            <CardDescription className="text-sm mt-1">
				{plan?.description?.length > 20
					? `${plan.description.slice(0, 20)}...`
					: plan.description}
			</CardDescription>

          </div>
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-vox-primary text-white">
            {plan.is_active ? "Active" : "Inactive"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Contribution</p>
            <p className="font-bold text-lg">{plan.contribution_amount ? (parseInt(plan.contribution_amount) / 1000000).toFixed(2) : '0'} STX</p>
            <p className="text-xs text-gray-500">per {frequencyToText[plan.frequency] || plan.frequency}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-bold text-lg">{plan.duration_months}</p>
            <p className="text-xs text-gray-500">
              {plan.duration_months === 1 ? 'month' : 'months'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Users size={16} className="text-gray-500" />
            <span className="text-sm ml-1 text-gray-500">
              {participants.length}/{plan.total_participants} participants
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {plan.total_participants > 0
              ? ((participants.length / plan.total_participants) * 100).toFixed(0)
              : 0
            }%
          </span>
        </div>
        <Progress
          value={
            plan.total_participants > 0
              ? (participants.length / plan.total_participants) * 100
              : 0
          }
          className="h-2"
        />
      </CardContent>
      <CardFooter>
        {isParticipantOrAdmin ? (
          <Link to={`/groups/${plan.id}`} className="w-full">
            <Button className="w-full" variant="outline">View Details</Button>
          </Link>
        ) : plan.is_active ? (
          <Link to={`/groups/${plan.id}`} className="w-full">
            <Button className="w-full gradient-bg text-white hover:opacity-90 transition-opacity">Join Plan</Button>
          </Link>
        ) : (
          <Button disabled className="w-full">Group Inactive</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlanCard;
