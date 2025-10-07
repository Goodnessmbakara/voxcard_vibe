import { motion } from 'framer-motion';


const socialLinks = [
  { 
    href: 'https://twitter.com/_voxcard', 
    label: 'Twitter', 
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
    hoverColor: 'hover:text-[#1DA1F2]'
  },
  { 
    href: 'https://github.com/Goodnessmbakara/voxcard_stacks', 
    label: 'GitHub', 
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ),
    hoverColor: 'hover:text-[#333333]'
  },
  { 
    href: 'https://voxcard.biz', 
    label: 'Website', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
      </svg>
    ),
    hoverColor: 'hover:text-vox-accent'
  },
];

const Footer = () => {
  return (
	<footer className="relative overflow-hidden">
		{/* Background with animated gradient */}
		<div className="absolute inset-0 bg-gradient-to-br from-vox-primary via-vox-secondary to-vox-primary"></div>
		
		{/* Animated background pattern */}
		<motion.div 
			className="absolute inset-0 opacity-10"
			animate={{ 
				background: [
					"radial-gradient(circle at 20% 50%, rgba(244,128,36,0.3) 0%, transparent 50%)",
					"radial-gradient(circle at 80% 50%, rgba(0,149,255,0.3) 0%, transparent 50%)",
					"radial-gradient(circle at 20% 50%, rgba(244,128,36,0.3) 0%, transparent 50%)"
				]
			}}
			transition={{ duration: 8, repeat: Infinity }}
		/>
		
		{/* Main content */}
		<div className="relative z-10 text-white pt-12 pb-8 mt-8">
			<div className="container mx-auto px-4">

				{/* Footer content grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
					{/* Brand section */}
					<motion.div 
						className="text-center md:text-left"
						initial={{ opacity: 0, x: -30 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						<motion.div 
							className="mb-4"
							whileHover={{ scale: 1.05 }}
						>
							<span className="font-heading text-3xl font-bold tracking-tight">VoxCard</span>
						</motion.div>
						<motion.span 
							className="text-vox-accent font-sans font-semibold text-lg tracking-wide block mb-3"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.5 }}
						>
							Save Safe, Win Sure.
						</motion.span>
						<p className="text-gray-200 text-sm leading-relaxed">
							Empowering communities through decentralized savings and rotating credit. 
							Built on Stacks blockchain for transparency and trust.
						</p>
					</motion.div>

					{/* Quick Links */}
					<motion.div 
						className="text-center md:text-left"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.4 }}
					>
						<h4 className="text-xl font-heading font-semibold mb-6 text-white">Quick Links</h4>
						<ul className="space-y-3">
							{[
								{ href: "/about", label: "About" },
								{ href: "/groups", label: "Saving Groups" },
								{ href: "/dashboard", label: "Dashboard" },
								{ href: "/support", label: "Support" }
							].map((link) => (
								<li key={link.label}>
									<motion.a 
										href={link.href} 
										className="text-gray-200 hover:text-vox-primary transition-colors duration-300 inline-block"
										whileHover={{ x: 5 }}
									>
										{link.label}
									</motion.a>
								</li>
							))}
						</ul>
					</motion.div>

					{/* Social Links */}
					<motion.div 
						className="text-center md:text-left"
						initial={{ opacity: 0, x: 30 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8, delay: 0.6 }}
					>
						<h4 className="text-xl font-heading font-semibold mb-6 text-white">Connect With Us</h4>
						<div className="flex justify-center md:justify-start space-x-6 mb-6">
							{socialLinks.map((link, idx) => (
								<motion.a
									key={link.label}
									href={link.href}
									target="_blank"
									rel="noopener noreferrer"
									initial={{ opacity: 0, scale: 0 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.8 + idx * 0.1 }}
									whileHover={{ 
										scale: 1.2, 
										rotate: [0, -5, 5, 0],
										y: -2
									}}
									whileTap={{ scale: 0.9 }}
									className={`text-white ${link.hoverColor} transition-all duration-300 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20`}
									aria-label={link.label}
								>
									{link.icon}
								</motion.a>
							))}
						</div>
						<p className="text-gray-300 text-sm">
							Follow us for updates and community news
						</p>
					</motion.div>
				</div>

				{/* Bottom section */}
				<motion.div 
					className="border-t border-white/20 pt-6 text-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1 }}
				>
					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						<span className="text-sm text-gray-300">
							&copy; {new Date().getFullYear()} VoxCard. All rights reserved.
						</span>
						<div className="flex gap-6 text-sm">
							<a href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy</a>
							<a href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms</a>
							<span className="text-vox-accent">Built on Stacks</span>
						</div>
					</div>
				</motion.div>
			</div>
		</div>

		{/* Animated bottom border */}
		<motion.div
			className="absolute left-0 right-0 bottom-0 h-1 bg-gradient-to-r from-vox-accent via-vox-primary to-vox-accent"
			initial={{ scaleX: 0 }}
			animate={{ scaleX: 1 }}
			transition={{ duration: 1.2, delay: 0.5 }}
		/>
	</footer>
  );
};

export default Footer;
