import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Database, Users, Globe, AlertTriangle, CheckCircle } from "lucide-react";

const Privacy = () => {
  const lastUpdated = "October 7, 2025";

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
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-12 w-12 text-vox-primary mr-4" />
              <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight">
                <span className="gradient-text">Privacy Policy</span>
              </h1>
            </div>
            
            <p className="text-lg text-vox-secondary/80 mb-8 font-sans max-w-3xl mx-auto">
              Your privacy and data security are fundamental to VoxCard. 
              Learn how we protect your information in our decentralized savings platform.
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-vox-secondary/60">
              <span>Last Updated: {lastUpdated}</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                GDPR Compliant
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            {/* Key Principles */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-vox-primary/5 to-vox-accent/5 mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Lock className="h-6 w-6 text-vox-primary" />
                  Our Privacy Principles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-vox-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-vox-secondary mb-2">Decentralized by Design</h4>
                      <p className="text-sm text-gray-600">
                        Your data is stored on the blockchain, not in our servers. You maintain full control.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-vox-accent mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-vox-secondary mb-2">Transparent Operations</h4>
                      <p className="text-sm text-gray-600">
                        All transactions and smart contract interactions are publicly verifiable.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Database className="h-5 w-5 text-vox-secondary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-vox-secondary mb-2">Minimal Data Collection</h4>
                      <p className="text-sm text-gray-600">
                        We only collect what's necessary for the platform to function.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-vox-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-vox-secondary mb-2">User Control</h4>
                      <p className="text-sm text-gray-600">
                        You can disconnect your wallet and stop using the platform at any time.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card className="border-0 shadow-lg mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Database className="h-6 w-6 text-vox-accent" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-vox-secondary mb-3">Blockchain Data (Public)</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-vox-primary mt-1">•</span>
                      <span>Your Stacks wallet address (publicly visible on blockchain)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-vox-primary mt-1">•</span>
                      <span>Smart contract interactions (contributions, payouts, group creation)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-vox-primary mt-1">•</span>
                      <span>Trust scores and reputation data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-vox-primary mt-1">•</span>
                      <span>Group participation history</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-vox-secondary mb-3">Application Data (Minimal)</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-vox-accent mt-1">•</span>
                      <span>Browser session data (temporary, deleted when you close browser)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-vox-accent mt-1">•</span>
                      <span>Wallet connection preferences (stored locally in your browser)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-vox-accent mt-1">•</span>
                      <span>Error logs (anonymized, for debugging purposes only)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">Important Note</h4>
                      <p className="text-sm text-yellow-700">
                        We do NOT collect personal information like names, emails, phone numbers, or KYC data. 
                        Your identity remains pseudonymous through your wallet address.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Information */}
            <Card className="border-0 shadow-lg mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Eye className="h-6 w-6 text-vox-primary" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-vox-secondary mb-3">Smart Contract Operations</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Execute savings group transactions</li>
                      <li>• Calculate and update trust scores</li>
                      <li>• Process contribution and payout logic</li>
                      <li>• Manage group membership and approvals</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-vox-secondary mb-3">Platform Functionality</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Display your dashboard and group information</li>
                      <li>• Show community statistics and leaderboards</li>
                      <li>• Provide transaction history and status</li>
                      <li>• Enable wallet connection and management</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Sharing */}
            <Card className="border-0 shadow-lg mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Globe className="h-6 w-6 text-vox-accent" />
                  Data Sharing and Disclosure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-3">We Do NOT Share Your Data</h4>
                  <p className="text-sm text-green-700 mb-3">
                    VoxCard operates on a decentralized model. We do not have access to your personal data to share.
                  </p>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• No third-party data sharing</li>
                    <li>• No marketing partnerships</li>
                    <li>• No data sales</li>
                    <li>• No analytics tracking</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-vox-secondary mb-3">Public Blockchain Data</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    The following information is publicly visible on the Stacks blockchain:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Your wallet address and transaction history</li>
                    <li>• Group participation and contribution amounts</li>
                    <li>• Trust scores and reputation data</li>
                    <li>• Smart contract interactions and timestamps</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card className="border-0 shadow-lg mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Shield className="h-6 w-6 text-vox-primary" />
                  Your Rights and Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-vox-secondary mb-3">Full Control</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Disconnect your wallet at any time</li>
                      <li>• Stop participating in groups</li>
                      <li>• Create new wallet addresses</li>
                      <li>• Use different browsers or devices</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-vox-secondary mb-3">Blockchain Transparency</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• All transactions are publicly verifiable</li>
                      <li>• Smart contract code is open source</li>
                      <li>• No hidden data collection</li>
                      <li>• Complete audit trail available</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Measures */}
            <Card className="border-0 shadow-lg mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Lock className="h-6 w-6 text-vox-accent" />
                  Security Measures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-vox-primary/10 flex items-center justify-center">
                      <Shield className="h-8 w-8 text-vox-primary" />
                    </div>
                    <h4 className="font-semibold text-vox-secondary mb-2">Blockchain Security</h4>
                    <p className="text-sm text-gray-600">
                      Built on Stacks blockchain with Bitcoin-level security guarantees
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-vox-accent/10 flex items-center justify-center">
                      <Lock className="h-8 w-8 text-vox-accent" />
                    </div>
                    <h4 className="font-semibold text-vox-secondary mb-2">Smart Contract Security</h4>
                    <p className="text-sm text-gray-600">
                      Clarity language prevents many common vulnerabilities
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-vox-secondary/10 flex items-center justify-center">
                      <Eye className="h-8 w-8 text-vox-secondary" />
                    </div>
                    <h4 className="font-semibold text-vox-secondary mb-2">Transparent Operations</h4>
                    <p className="text-sm text-gray-600">
                      All code and operations are publicly auditable
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-vox-primary/5 to-vox-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Users className="h-6 w-6 text-vox-primary" />
                  Questions About Privacy?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-vox-secondary/80 mb-6">
                  If you have any questions about this privacy policy or how we handle your data, 
                  please don't hesitate to contact us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="mailto:privacy@voxcard.app"
                    className="inline-flex items-center gap-2 text-vox-primary hover:text-vox-accent transition-colors"
                  >
                    <span>privacy@voxcard.app</span>
                  </a>
                  <a 
                    href="https://github.com/voxcard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-vox-primary hover:text-vox-accent transition-colors"
                  >
                    <span>View Source Code</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Privacy;
