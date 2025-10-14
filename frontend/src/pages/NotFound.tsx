
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search, Users, Target, HelpCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const quickLinks = [
    { name: "Dashboard", path: "/dashboard", icon: Target, description: "View your savings groups" },
    { name: "Browse Groups", path: "/groups", icon: Users, description: "Find savings circles" },
    { name: "Community", path: "/community", icon: Users, description: "See community stats" },
    { name: "Create Group", path: "/groups/create", icon: Target, description: "Start a new group" },
  ];

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
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="h-32 w-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-vox-primary/20 to-vox-accent/20 flex items-center justify-center shadow-lg"
            >
              <span className="text-6xl font-bold gradient-text">404</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 leading-tight">
              <span className="gradient-text">Page Not Found</span>
            </h1>
            
            <p className="text-lg text-vox-secondary/80 mb-8 font-sans max-w-2xl mx-auto">
              Oops! The page you're looking for seems to have wandered off. 
              Don't worry, let's get you back on track with VoxCard.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            {/* Error Details */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-vox-primary/5 to-vox-accent/5 mb-12">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-vox-primary mr-3" />
                  <h2 className="text-2xl font-bold text-vox-secondary">What happened?</h2>
                </div>
                <p className="text-vox-secondary/80 mb-4">
                  The page <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{location.pathname}</code> doesn't exist.
                </p>
                <p className="text-sm text-gray-600">
                  This might be due to a typo in the URL, the page being moved, or it never existed.
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-vox-secondary mb-8">Let's get you back on track</h3>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="border-vox-primary text-vox-primary hover:bg-vox-primary/10 w-full sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
                <Link to="/">
                  <Button className="w-full sm:w-auto gradient-bg text-white hover:opacity-90 transition-opacity">
                    <Home className="mr-2 h-4 w-4" />
                    Return Home
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickLinks.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  <Link to={link.path}>
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-vox-primary/10 to-vox-accent/10 flex items-center justify-center">
                          <link.icon className="h-6 w-6 text-vox-primary" />
                        </div>
                        <h4 className="font-semibold text-vox-secondary mb-2">{link.name}</h4>
                        <p className="text-sm text-gray-600">{link.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-16 text-center"
            >
              <Card className="border-0 shadow-lg bg-gradient-to-r from-vox-accent/5 to-vox-primary/5">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center mb-4">
                    <HelpCircle className="h-8 w-8 text-vox-accent mr-3" />
                    <h3 className="text-xl font-bold text-vox-secondary">Need Help?</h3>
                  </div>
                  <p className="text-vox-secondary/80 mb-4">
                    If you're still having trouble finding what you're looking for, 
                    try browsing our main sections or contact our support team.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/about">
                      <Button variant="outline" className="border-vox-accent text-vox-accent hover:bg-vox-accent/10">
                        Learn More
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="border-vox-primary text-vox-primary hover:bg-vox-primary/10"
                      onClick={() => window.open('mailto:support@voxcard.app', '_blank')}
                    >
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default NotFound;
