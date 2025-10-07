import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { VoxCardLogo } from "@/components/shared/VoxCardLogo";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/services/utils";
import { useStacksWallet } from "@/context/StacksWalletProvider";

export const Header = () => {
  const [showDisconnect, setShowDisconnect] = useState(false);
  const disconnectMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Stacks wallet hooks
  const { isConnected, address, connectWallet, disconnectWallet } = useStacksWallet();

  useEffect(() => {
    if (!showDisconnect) return;
    function handleClick(event: MouseEvent) {
      if (
        disconnectMenuRef.current &&
        !disconnectMenuRef.current.contains(event.target as Node)
      ) {
        setShowDisconnect(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDisconnect]);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <VoxCardLogo variant="full" size="md" linkTo="/" colorScheme="primary" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/dashboard"
              className="text-vox-secondary whitespace-nowrap hover:text-vox-primary transition-colors font-sans"
            >
              Dashboard
            </Link>
            <Link
              to="/groups"
              className="text-vox-secondary whitespace-nowrap hover:text-vox-primary transition-colors font-sans"
            >
              Savings Groups
            </Link>
            <Link
              to="/community"
              className="text-vox-secondary whitespace-nowrap hover:text-vox-primary transition-colors font-sans"
            >
              Community
            </Link>
            <Link
              to="/about"
              className="text-vox-secondary hover:text-vox-primary whitespace-nowrap transition-colors font-sans"
            >
              About
            </Link>
            {isConnected && address ? (
              <div className="relative">
                <Button
                  onClick={() => setShowDisconnect((v) => !v)}
                  className="gradient-bg text-white"
                >
                  {shortenAddress(address)}
                </Button>
                {showDisconnect && (
                  <div
                    ref={disconnectMenuRef}
                    className="absolute right-0 mt-2 bg-white border rounded shadow z-50 min-w-[140px]"
                  >
                    <button
                      className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                      onClick={() => {
                        disconnectWallet();
                        setShowDisconnect(false);
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                className="gradient-bg text-white"
              >
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost">
                  <Menu className="h-6 w-6 text-vox-secondary" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <VoxCardLogo variant="full" size="md" linkTo="/" colorScheme="primary" />
                  </div>

                  <nav className="space-y-4">
                    <Link
                      to="/dashboard"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/groups"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      Savings Groups
                    </Link>
                    <Link
                      to="/community"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      Community
                    </Link>
                    <Link
                      to="/about"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      About
                    </Link>
                  </nav>

                  {/* Wallet connect button for mobile */}
                  <div className="mt-8">
                    {isConnected && address ? (
                      <>
                        <div className="flex items-center gap-2 bg-gray-50 rounded px-3 py-2 mb-2">
                          <span className="font-mono text-xs break-all">
                            {shortenAddress(address)}
                          </span>
                        </div>
                        <Button
                          className="w-full border-red-500 text-red-600 hover:bg-red-50 mb-2"
                          variant="outline"
                          onClick={disconnectWallet}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="w-full gradient-bg text-white"
                        onClick={connectWallet}
                      >
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
