import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import CreateGroup from "./pages/CreateGroup";
import Community from "./pages/Community";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import About from './pages/About';
import { StacksWalletProvider } from "./context/StacksWalletProvider";
import { StacksContractProvider } from "./context/StacksContractProvider";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <StacksWalletProvider>
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
              <Header />

              <main className="container mx-auto px-4 py-8 flex-1 w-full">
                <StacksContractProvider>
                  <AnimatePresence mode="wait">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/groups/create" element={<CreateGroup />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/groups" element={<Groups />} />
                      <Route path="/groups/:planId" element={<GroupDetail />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AnimatePresence>
                </StacksContractProvider>
              </main>

              <Footer />
            </div>
          </StacksWalletProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
