import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  Star, 
  Shield, 
  Clock, 
  Award,
  Target,
  Zap,
  ArrowRight,
  Heart
} from "lucide-react";
import { Link } from "react-router-dom";
import { useStacksWallet } from "@/context/StacksWalletProvider";
import { useContract } from "@/context/StacksContractProvider";
import { shortenAddress } from "@/services/utils";
import { CommunityStats, LeaderboardUser, RecentActivity } from "@/context/StacksContractProvider";

// Interfaces are now imported from StacksContractProvider

const Community = () => {
  const { isConnected, address } = useStacksWallet();
  const { getTrustScore, getGroupCount, getTotalContributed, getCommunityStats, getLeaderboard, getRecentActivity } = useContract();
  
  const [stats, setStats] = useState<CommunityStats>({
    totalUsers: 0,
    totalGroups: 0,
    totalContributed: 0,
    activeGroups: 0,
    completedGroups: 0,
    averageTrustScore: 0
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const [userRank, setUserRank] = useState<number | null>(null);
  const [userTrustScore, setUserTrustScore] = useState<number>(0);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        // Fetch community stats
        const communityStats = await getCommunityStats();
        setStats(communityStats);
        
        // Fetch leaderboard
        const leaderboardData = await getLeaderboard(10);
        setLeaderboard(leaderboardData);
        
        // Fetch recent activity
        const activityData = await getRecentActivity(10);
        setRecentActivity(activityData);
        
        // Fetch user's trust score and rank
        if (isConnected && address) {
          const trustScore = await getTrustScore(address);
          setUserTrustScore(trustScore);
          
          // Find user's rank in leaderboard
          const userIndex = leaderboardData.findIndex(user => user.address === address);
          if (userIndex !== -1) {
            setUserRank(userIndex + 1);
          }
        }
      } catch (error) {
        console.error("Error fetching community data:", error);
      }
    };
    
    fetchCommunityData();
  }, [isConnected, address, getTrustScore, getCommunityStats, getLeaderboard, getRecentActivity]);


  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contribution':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'group_created':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'group_completed':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'trust_score_up':
        return <Star className="h-4 w-4 text-purple-500" />;
      default:
        return <Heart className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-vox-primary/5 to-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 leading-tight">
              <span className="gradient-text">VoxCard</span> Community
            </h1>
            <p className="text-lg text-vox-secondary/80 mb-8 font-sans max-w-3xl mx-auto">
              Join thousands of users building trust and saving together on the blockchain
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container">

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-vox-primary/10 to-vox-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-vox-primary">Total Users</p>
                    <p className="text-3xl font-bold text-vox-secondary">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-vox-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-vox-accent/10 to-vox-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-vox-accent">Total Contributed</p>
                    <p className="text-3xl font-bold text-vox-secondary">{stats.totalContributed.toLocaleString()} STX</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-vox-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-vox-secondary/10 to-vox-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-vox-secondary">Active Groups</p>
                    <p className="text-3xl font-bold text-vox-secondary">{stats.activeGroups}</p>
                  </div>
                  <Target className="h-8 w-8 text-vox-secondary" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Status Card */}
          {isConnected && address && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
            >
              <Card className="border-0 shadow-lg bg-gradient-to-r from-vox-accent to-vox-primary">
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Your Community Status</h3>
                      <div className="flex items-center space-x-6">
                        <div>
                          <p className="text-sm opacity-90">Trust Score</p>
                          <p className="text-2xl font-bold">{isNaN(userTrustScore) ? '50' : userTrustScore}</p>
                        </div>
                        {userRank && (
                          <div>
                            <p className="text-sm opacity-90">Rank</p>
                            <p className="text-2xl font-bold">#{userRank}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm opacity-90">Address</p>
                          <p className="text-sm font-mono">{shortenAddress(address)}</p>
                        </div>
                      </div>
                    </div>
                    <Shield className="h-12 w-12 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs defaultValue="leaderboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Trust Score Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Top contributors ranked by trust score and community participation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboard.length > 0 ? (
                      leaderboard.map((user, index) => (
                      <motion.div
                        key={user.address}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-400 text-white' :
                            index === 1 ? 'bg-gray-300 text-white' :
                            index === 2 ? 'bg-orange-400 text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-mono text-sm font-medium">{shortenAddress(user.address)}</p>
                            <p className="text-xs text-gray-500">{user.groupsParticipated} groups participated</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-semibold">{user.trustScore}</p>
                            <p className="text-xs text-gray-500">trust score</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{user.totalContributed.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">STX contributed</p>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Shield className="h-3 w-3 mr-1" />
                            {user.trustScore >= 90 ? 'Elite' : user.trustScore >= 80 ? 'Trusted' : 'Member'}
                          </Badge>
                        </div>
                      </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-sans">No leaderboard data available yet. Start participating to see rankings!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Recent Community Activity
                  </CardTitle>
                  <CardDescription>
                    Live feed of community contributions and achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {shortenAddress(activity.user)}
                          </p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          {activity.amount && (
                            <p className="text-xs text-green-600 font-medium">
                              +{activity.amount} STX
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-xs text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                      </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-sans">No recent activity yet. Be the first to contribute!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">First Contribution</h3>
                    <p className="text-sm text-gray-600 mb-4">Make your first contribution to any savings plan</p>
                    <Badge className="bg-yellow-200 text-yellow-800">Common</Badge>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Group Creator</h3>
                    <p className="text-sm text-gray-600 mb-4">Create your first savings group</p>
                    <Badge className="bg-blue-200 text-blue-800">Common</Badge>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-6 text-center">
                    <Star className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Trust Builder</h3>
                    <p className="text-sm text-gray-600 mb-4">Reach a trust score of 80 or higher</p>
                    <Badge className="bg-purple-200 text-purple-800">Rare</Badge>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-6 text-center">
                    <Award className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Perfect Participant</h3>
                    <p className="text-sm text-gray-600 mb-4">Complete a savings plan with 100% on-time payments</p>
                    <Badge className="bg-green-200 text-green-800">Epic</Badge>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
                  <CardContent className="p-6 text-center">
                    <Zap className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Community Champion</h3>
                    <p className="text-sm text-gray-600 mb-4">Participate in 10 or more savings plans</p>
                    <Badge className="bg-red-200 text-red-800">Legendary</Badge>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100">
                  <CardContent className="p-6 text-center">
                    <Shield className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Elite Member</h3>
                    <p className="text-sm text-gray-600 mb-4">Achieve a trust score of 95 or higher</p>
                    <Badge className="bg-indigo-200 text-indigo-800">Mythic</Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-vox-primary to-vox-accent">
              <CardContent className="p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Ready to Join the Community?</h2>
                <p className="text-lg mb-6 opacity-90">
                  Start building your trust score and saving with others today
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/groups">
                    <Button
                      size="lg"
                      className="bg-white text-vox-primary hover:bg-gray-100 w-full sm:w-auto"
                    >
                      Browse Savings Groups
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/groups/create">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-vox-primary w-full sm:w-auto bg-transparent"
                    >
                      Create Your Group
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Community;
