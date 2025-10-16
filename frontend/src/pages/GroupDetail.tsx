import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import TrustScoreBadge from "@/components/shared/TrustScoreBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useContract } from "@/context/StacksContractProvider";
import { Group } from "@/context/StacksContractProvider";	
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Check, Users } from "lucide-react";
import ContributeModal from "@/components/modals/ContributeModal";
import { useStacksWallet } from "@/context/StacksWalletProvider";
import { shortenAddress, formatMicroSTXToSTX } from "@/services/utils";
import type { ParticipantCycleStatus } from "@/context/StacksContractProvider";
import ParticipantDebug from "@/components/debug/ParticipantDebug";


const GroupDetail = () => {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const { planId } = useParams<{ planId: string }>();
  const { 
	requestJoinGroup, 
	getJoinRequests,
	approveJoinRequest,
	denyJoinRequest,
	getParticipantCycleStatus,
	getTotalParticipantContributions,
	getGroupParticipants,
	getTrustScore
 } = useContract();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [plan, setPlan] = useState<Group | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const { address: walletAddress } = useStacksWallet();
  const { getGroupById } = useContract();
  const address = (walletAddress || "").toLowerCase();
  const participants = Array.isArray(plan?.participants) ? plan.participants : [];
  const isParticipantOrAdmin =
    participants.map((addr) => addr.toLowerCase()).includes(address) ||
    plan?.creator?.toLowerCase() === address;

	const [cycleStatus, setCycleStatus] = useState<ParticipantCycleStatus | null>(null);
	const [totalContributions, setTotalContributions] = useState<number>(0);

	const contributeDisabled =
		!isParticipantOrAdmin ||
		(cycleStatus?.fully_contributed ?? false);

  useEffect(() => {
    const fetchPlan = async () => {
      if (planId) {
        const res = await getGroupById(Number(planId));
        if (res?.group) setPlan(res.group);
      }
    };
    fetchPlan();
  }, [planId, address, refreshNonce]);

  useEffect(() => {
	const fetchRequests = async () => {
		if (planId && isParticipantOrAdmin) {
		try {
			const res = await getJoinRequests(Number(planId));
			setJoinRequests(res?.requests ?? []);
		} catch (err) {
			console.error("Failed to fetch join requests:", err);
		}
		}
	};
	fetchRequests();
	}, [planId, isParticipantOrAdmin, refreshNonce]);

	useEffect(() => {
		const fetchStatus = async () => {
			if (!planId || !address || !isParticipantOrAdmin) {
				setCycleStatus(null);
				setTotalContributions(0);
				return;
			}
			try {
			const res = await getParticipantCycleStatus(Number(planId), address);
			setCycleStatus(res);
			} catch (e) {
			console.error("GetParticipantCycleStatus failed:", e);
			setCycleStatus(null);
			}
		};
		fetchStatus();
	}, [planId, address, isParticipantOrAdmin, refreshNonce]);

	// New useEffect to fetch total contributions across all cycles
	useEffect(() => {
		const fetchTotalContributions = async () => {
			if (!planId || !address || !isParticipantOrAdmin) {
				setTotalContributions(0);
				return;
			}
			try {
				const total = await getTotalParticipantContributions(Number(planId), address);
				setTotalContributions(total);
			} catch (e) {
				console.error("GetTotalParticipantContributions failed:", e);
				setTotalContributions(0);
			}
		};
		fetchTotalContributions();
	}, [planId, address, isParticipantOrAdmin, refreshNonce]);


	const refetchAll = () => setRefreshNonce(n => n + 1);
	
  const handleJoinPlan = async () => {
	if (!planId || !address) {
		toast({
		title: " You are not signed in",
		description: "Please sign up to join this group",
		variant: "destructive",
		});
		return;
	}

	try {
		setJoining(true);
		await requestJoinGroup(Number(planId));
		setJoined(true);
	} catch (error) {
		console.error(error.message)
		toast({
		title: "Join request failed",
		description: (error as Error).message || "Something went wrong",
		variant: "destructive",
		});
	} finally {
		setTimeout(() => {
		setJoining(false);
		setJoined(false);
		}, 2000);
	}
	};

	const handleAcceptOrDenyRequest = async (
		planId: number,
		requester: string,
		isApprove: boolean
		) => {
		try {
			if (isApprove) {
			await approveJoinRequest(planId, requester);
			toast({
				title: "Approved",
				description: `${requester} has been approved.`,
			});
			} else {
			await denyJoinRequest(planId, requester);
			toast({
				title: "Denied",
				description: `${requester} has been denied.`,
			});
			}

			// Remove from list after action
			setJoinRequests((prev) =>
			Array.isArray(prev) ? prev.filter((r) => r.requester !== requester) : []
			);
			refetchAll()
		} catch (err) {
			console.error(err.message)
			toast({
			title: "Error",
			description: (err as Error).message,
			variant: "destructive",
			});
		}
	};


	const filteredJoinRequests = Array.isArray(joinRequests) ? joinRequests.filter(
		(request) =>
			!request.approvals.includes(address) && !request.denials.includes(address)
	) : [];

  const handleContribute = async () => {
    setContributeModalOpen(true);
  };

  const [trustScores, setTrustScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchScores = async () => {
      const scores: Record<string, number> = {};
      for (const participant of participants) {
        const score = await getTrustScore(participant);
        scores[participant] = Number(score);
      }
      setTrustScores(scores);
    };

    fetchScores();
  }, [participants]);

  if (!plan) {
    return (
		<>
			<div className="container py-16 text-center">
			<h1 className="text-3xl font-heading font-bold mb-4 text-vox-secondary">
				Loading Group...
			</h1>
			<p className="mb-8 text-vox-secondary/70 font-sans">
				Please wait while we fetch group details.
			</p>
			<Link to="/groups">
				<Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">
				Back to Groups
				</Button>
			</Link>
			</div>
		</>
        
    );
  }

  const participationRate = plan.total_participants > 0
    ? (participants.length / plan.total_participants) * 100
    : 0;

  return (
    <>
      <div className="container min-h-screen py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center">
            <div className="w-96">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-heading font-bold text-vox-secondary">{plan.name}</h1>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-vox-primary/10 text-vox-primary capitalize">
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-vox-secondary/70 mt-2 font-sans">{plan.description}</p>
            </div>

            {!isParticipantOrAdmin && (
              <Button
                className="mt-4 md:mt-0 gradient-bg text-white"
                onClick={handleJoinPlan}
              >
                Request to Join
              </Button>
            )}
			

					<div className="flex gap-2">
						{isParticipantOrAdmin && (
						<div className="mt-4 md:mt-0 flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-md">
							<Check size={16} />
							<span>You're a participant</span>
						</div>
						)}

						{isParticipantOrAdmin && (
							<Button
								className="mt-4 md:mt-0 gradient-bg text-white"
								onClick={handleContribute}
								disabled={contributeDisabled}
								title={cycleStatus?.fully_contributed ? "You already contributed this cycle" : undefined}
							>
								{cycleStatus?.fully_contributed ? "Contributed" : "Contribute"}
							</Button>
						)}

					</div>
            
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Group Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-vox-secondary/60">Contribution</p>
                    <p className="font-bold text-lg">{formatMicroSTXToSTX(Number(plan.contribution_amount))} STX</p>
                    <p className="text-xs text-vox-secondary/60">{plan.frequency.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-vox-secondary/60">Duration</p>
                    <p className="font-bold text-lg">{plan.duration_months}</p>
                    <p className="text-xs text-vox-secondary/60">
                      {plan.duration_months === 1 ? "month" : "months"}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <Users size={16} className="mr-1 text-vox-secondary/50" />
                      <span className="text-sm">{participants.length}/{plan.total_participants} participants</span>
                    </div>
                    <span className="text-sm">{participationRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={participationRate} className="h-2" />
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-sm text-vox-secondary/60">Initiator</span>
                  <span className="text-sm">{shortenAddress(plan.creator)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-vox-secondary/60">Min Trust Score</span>
                  <span className="text-sm">{plan.trust_score_required}/100</span>
                </div>
              </CardContent>
            </Card>

			{isParticipantOrAdmin && (
				<Card>
					<CardHeader>
						<CardTitle>Your Contribution</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Total Contributions Across All Cycles */}
						<div className="bg-green-50 border border-green-200 rounded-lg p-3">
							<p className="text-green-800 font-semibold">
								Total STX Contributed: <b>{formatMicroSTXToSTX(totalContributions)} STX</b>
							</p>
							<p className="text-green-600 text-sm">
								Across all cycles to this group
							</p>
						</div>
						
						{/* Current Cycle Status */}
						{cycleStatus?.fully_contributed ? (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
								<p className="text-blue-800 font-semibold">✅ You have completed payment for this cycle.</p>
							</div>
						) : (
							<div className="space-y-2">
								<p>STX contributed to Current Cycle: <b>{formatMicroSTXToSTX(Number(cycleStatus?.contributed_this_cycle || 0))} STX</b></p>
								<p>STX unpaid to Current Cycle: <b>{formatMicroSTXToSTX(Number(cycleStatus?.remaining_this_cycle || 0))} STX</b></p>
								{Number(cycleStatus?.debt || 0) > 0 && (
									<p className="text-orange-600">Debt from previous cycles: <b>{formatMicroSTXToSTX(Number(cycleStatus?.debt || 0))} STX</b></p>
								)}
							</div>
						)}
					</CardContent>
				</Card>

			)}

			{/* Group Management - Only visible to creator */}
			{plan?.creator?.toLowerCase() === address && (
				<Card className="border-orange-200 bg-orange-50/30">
					<CardHeader className="pb-3">
						<CardTitle className="text-orange-800 text-sm">Group Management</CardTitle>
					</CardHeader>
					<CardContent className="pt-0">
						<Button
							variant="outline"
							size="sm"
							className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400"
							onClick={() => {
								// Call your activate/deactivate function here
								console.log("Toggle group active state");
							}}
						>
							{plan?.is_active ? "⏸️ Deactivate Group" : "▶️ Activate Group"}
						</Button>
						<p className="text-xs text-orange-600 mt-2">
							{plan?.is_active 
								? "Deactivating will pause new contributions" 
								: "Activating will allow new contributions"
							}
						</p>
					</CardContent>
				</Card>
			)}

          </div>

		  
          {/* Main Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="schedule">Payout Schedule</TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>How This Group Works</CardTitle>
                    <CardDescription>Understand the savings rotation process.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>This is a {plan.frequency.toLowerCase()} group plan where each member contributes {formatMicroSTXToSTX(Number(plan.contribution_amount))} STX for {plan.duration_months} {plan.duration_months === 1 ? "month" : "months"}.</p>
                    <p>One member gets the pooled amount each cycle. The order is based on trust scores and join order.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Members */}
              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Participants</CardTitle>
                        <CardDescription>
                          {participants.length} of {plan.total_participants} members
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setRefreshNonce(prev => prev + 1)}
                      >
                        Refresh Data
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Debug Info */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h4 className="font-medium text-blue-900 mb-2">Debug Info</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Group ID:</strong> {plan.id}</p>
                        <p><strong>Creator:</strong> {plan.creator}</p>
                        <p><strong>Your Address:</strong> {address}</p>
                        <p><strong>Is Creator:</strong> {plan.creator?.toLowerCase() === address ? 'Yes' : 'No'}</p>
                        <p><strong>Participants Array:</strong> {JSON.stringify(participants)}</p>
                        <p><strong>Participants Length:</strong> {participants.length}</p>
                        <p><strong>Is Participant:</strong> {participants.map((addr) => addr.toLowerCase()).includes(address) ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    
                    {participants.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No participants found. This might be a data fetching issue.</p>
                        <p className="text-sm mt-2">If you created this group, you should be listed as a participant.</p>
                      </div>
                    ) : (
                      participants.map((participant, idx) => (
                        <div key={idx} className="flex justify-between p-3 border rounded">
                          <span className="font-mono">{participant}</span>
                          <TrustScoreBadge score={trustScores[participant] ?? 50} />
                        </div>
                      ))
                    )}
                    
                    {/* Debug Component */}
                    <ParticipantDebug groupId={Number(planId)} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payout Schedule */}
              <TabsContent value="schedule">
                <Card>
                  <CardHeader><CardTitle>Payout Schedule</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {participants.map((participant, idx) => (
                      <div key={idx} className={`flex justify-between p-3 border rounded ${idx === plan.payout_index ? 'bg-green-50' : ''}`}>
                        <span>{idx + 1}. {participant}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
			
			{isParticipantOrAdmin && joinRequests.length > 0 && (
			<Card className="lg:col-span-3 mt-6">
				<CardHeader>
				<CardTitle>Pending Join Requests</CardTitle>
				<CardDescription>Approve or deny new members who want to join this group.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
				{filteredJoinRequests.map((requester, idx) => (
					<div key={idx} className="flex justify-between p-3 rounded items-center">
					<span className="font-mono">{requester.requester}</span>
					<div className="flex gap-2">
						<Button
							variant="outline"
							className="border-green-500 text-green-600 hover:bg-green-50"
							onClick={() =>
								handleAcceptOrDenyRequest(Number(planId), requester.requester, true)
							}
						>
							Approve
						</Button>
						<Button
							variant="outline"
							className="border-red-500 text-red-600 hover:bg-red-50"
							onClick={() =>
								handleAcceptOrDenyRequest(Number(planId), requester.requester, false)
							}
						>
							Deny
						</Button>
						</div>
					</div>
				))}
				</CardContent>
			</Card>
		  )}
          </div>

		  
        </div>
      </div>

      {/* Modals */}
      {joining && (
		<div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-white/90">
			{!joined ? (
			<>
				<div className="w-12 h-12 border-4 border-vox-primary border-t-transparent rounded-full animate-spin" />
				<p className="mt-4 text-vox-secondary font-semibold">Sending join request...</p>
			</>
			) : (
			<>
				<div className="text-green-600">
				<Check size={48} strokeWidth={3} />
				</div>
				<p className="mt-4 text-green-700 font-semibold">Request sent!</p>
			</>
			)}
		</div>
		)}

      <ContributeModal plan={plan} cycleStatus={cycleStatus} open={contributeModalOpen} onClose={() => setContributeModalOpen(false)} onSuccess={() => refetchAll()}/>
      
      {/* Floating Deactivate Button - Only visible to creator */}
      {plan?.creator?.toLowerCase() === address && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-lg transition-all duration-200"
            onClick={() => {
              // Call your activate/deactivate function here
              console.log("Toggle group active state");
            }}
            title={`${plan?.is_active ? "Deactivate" : "Activate"} this group`}
          >
            {plan?.is_active ? "Deactivate Group" : "Activate Group"}
          </Button>
        </div>
      )}
    </>
  );
};

export default GroupDetail;
