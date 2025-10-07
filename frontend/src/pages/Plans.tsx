import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Footer';
import PlanCard from '@/components/shared/PlanCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Users, Shield, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/context/StacksContractProvider';
import { Plan } from '@/types/utils';

const Plans = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10; // adjust as needed

  const { account, getPaginatedPlans } = useContract();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { plans: paginatedPlans, totalCount } = await getPaginatedPlans(page, pageSize);

        setPlans(paginatedPlans);
        // Optionally store totalCount for pagination UI
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [page, account]); // re-run if page changes

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && plan.is_active) ||
      (statusFilter === 'inactive' && !plan.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="relative container py-8">
        {/* UI remains the same... */}

        {/* Header Section with Search, Filter, and Create Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-16 z-20 backdrop-blur rounded-xl p-4 md:p-0 shadow md:shadow-none">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-3 text-vox-secondary/40" />
              <Input
                placeholder="Search groups by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-sans border-vox-primary focus:ring-vox-primary rounded-lg"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px] font-sans border-vox-primary focus:ring-vox-primary rounded-lg">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Group Button - Always visible when there are groups */}
          {filteredPlans.length > 0 && (
            <motion.div 
              className="flex justify-end mb-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link to="/groups/create">
                <motion.div
                  className="inline-flex items-center gap-2 px-6 py-3 bg-vox-primary text-white font-semibold rounded-lg hover:bg-vox-primary/90 transition-colors shadow-md"
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={20} />
                  Create New Group
                </motion.div>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {loading ? (
            <motion.div className="text-center py-16">Loading groups...</motion.div>
          ) : error ? (
            <motion.div className="text-center py-16">{error}</motion.div>
          ) : filteredPlans.length > 0 ? (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="max-w-4xl mx-auto">
                {/* Empty State Hero */}
                <motion.div 
                  className="mb-12"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-vox-primary/10 flex items-center justify-center">
                    <Users size={48} className="text-vox-primary" />
                  </div>
                  <h2 className="text-3xl font-heading font-bold text-gray-800 mb-4">
                    No groups found
                  </h2>
                  <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    Be the first to start a savings group in your community! 
                    Create a group and invite others to save together.
                  </p>
                </motion.div>

                {/* Create Group CTA Section */}
                <motion.div 
                  className="bg-gradient-to-br from-vox-primary/5 to-vox-accent/5 rounded-2xl p-8 md:p-12 border border-vox-primary/10"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-heading font-bold text-gray-800 mb-4">
                      Ready to Start Your Savings Journey?
                    </h3>
                    <p className="text-gray-600 text-lg">
                      Create a group and empower your community to save together
                    </p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                      {
                        icon: <Shield size={32} className="text-vox-primary" />,
                        title: "Secure & Transparent",
                        description: "Built on Stacks blockchain for complete transparency"
                      },
                      {
                        icon: <Users size={32} className="text-vox-primary" />,
                        title: "Community Driven",
                        description: "Connect with trusted members in your network"
                      },
                      {
                        icon: <Zap size={32} className="text-vox-primary" />,
                        title: "Smart Automation",
                        description: "Automated payouts and smart contract execution"
                      }
                    ].map((feature, idx) => (
                      <motion.div 
                        key={feature.title}
                        className="text-center p-6 bg-white rounded-xl shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-vox-primary/10 flex items-center justify-center">
                          {feature.icon}
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Link to="/groups/create">
                      <motion.div
                        className="inline-flex items-center gap-3 px-8 py-4 bg-vox-primary text-white font-semibold rounded-xl hover:bg-vox-primary/90 transition-colors shadow-lg"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus size={24} />
                        Create Your First Group
                        <ArrowRight size={20} />
                      </motion.div>
                    </Link>
                    <p className="text-sm text-gray-500 mt-3">
                      It only takes 2 minutes to get started
                    </p>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button - Always visible */}
        <motion.div
          className="fixed bottom-8 right-8 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Link to="/groups/create">
            <motion.div
              className="w-14 h-14 bg-vox-primary rounded-full shadow-lg flex items-center justify-center text-white hover:bg-vox-primary/90 transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus size={24} />
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </>
  );
};

export default Plans;
