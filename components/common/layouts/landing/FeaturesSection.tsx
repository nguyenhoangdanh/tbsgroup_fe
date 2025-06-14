'use client';

import { motion } from 'framer-motion';
import { Factory, Award, Globe, Shield, Truck, Users } from 'lucide-react';
import React from 'react';

const features = [
	{
		icon: Factory,
		title: 'Sản xuất hiện đại',
		description: 'Nhà máy với dây chuyền sản xuất hiện đại, công nghệ tiên tiến nhất.',
		color: 'from-green-500 to-green-600',
	},
	{
		icon: Award,
		title: 'Chất lượng ISO',
		description: 'Đạt chứng nhận ISO 9001:2015, đảm bảo chất lượng sản phẩm hàng đầu.',
		color: 'from-emerald-500 to-emerald-600',
	},
	{
		icon: Globe,
		title: 'Xuất khẩu toàn cầu',
		description: 'Sản phẩm được xuất khẩu đến hơn 50 quốc gia trên thế giới.',
		color: 'from-teal-500 to-teal-600',
	},
	{
		icon: Shield,
		title: 'Bảo hành uy tín',
		description: 'Cam kết bảo hành và hậu mãi chu đáo cho mọi sản phẩm.',
		color: 'from-lime-500 to-lime-600',
	},
	{
		icon: Truck,
		title: 'Giao hàng nhanh',
		description: 'Hệ thống logistics hiện đại, giao hàng nhanh chóng trên toàn quốc.',
		color: 'from-cyan-500 to-cyan-600',
	},
	{
		icon: Users,
		title: 'Đội ngũ chuyên nghiệp',
		description: 'Hơn 1000 nhân viên giàu kinh nghiệm và tận tâm với công việc.',
		color: 'from-green-600 to-emerald-600',
	},
];

const container = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const item = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			ease: 'easeOut',
		},
	},
};

const FeaturesSection = () => {
	return (
		<section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					viewport={{ once: true }}
					className="text-center mb-16"
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2, duration: 0.6 }}
						viewport={{ once: true }}
						className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium mb-4"
					>
						Tại sao chọn chúng tôi
					</motion.div>

					<h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
						Ưu thế cạnh tranh
					</h2>

					<p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
						Với hơn 25 năm kinh nghiệm trong ngành, chúng tôi tự hào mang đến
						những sản phẩm chất lượng cao và dịch vụ tốt nhất cho khách hàng.
					</p>
				</motion.div>

				{/* Features Grid */}
				<motion.div
					variants={container}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true }}
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
				>
					{features.map((feature, index) => (
						<motion.div
							key={index}
							variants={item}
							whileHover={{
								scale: 1.05,
								transition: { duration: 0.2 },
							}}
							className="group relative"
						>
							<div className="relative p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 overflow-hidden">
								{/* Background Gradient */}
								<div
									className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
								></div>

								{/* Icon */}
								<div
									className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
								>
									<feature.icon className="w-7 h-7" />
								</div>

								{/* Content */}
								<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
									{feature.title}
								</h3>

								<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
									{feature.description}
								</p>

								{/* Hover Effect Border */}
								<div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-700 transition-colors duration-300"></div>
							</div>
						</motion.div>
					))}
				</motion.div>

				{/* Bottom CTA */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.8 }}
					viewport={{ once: true }}
					className="text-center mt-16"
				>
					<div className="inline-flex items-center space-x-4 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
						<span>Tìm hiểu thêm về dịch vụ của chúng tôi</span>
						<motion.span
							animate={{ x: [0, 5, 0] }}
							transition={{ duration: 1.5, repeat: Infinity }}
						>
							→
						</motion.span>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default FeaturesSection;
