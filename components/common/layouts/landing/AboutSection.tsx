'use client';

import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp, Target, Heart } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

const achievements = [
  { label: 'Năm thành lập', value: '1998' },
  { label: 'Nhân viên', value: '1000+' },
  { label: 'Sản phẩm/năm', value: '2M+' },
  { label: 'Quốc gia xuất khẩu', value: '50+' }
];

const values = [
  {
    icon: Target,
    title: 'Chất lượng',
    description: 'Cam kết mang đến sản phẩm chất lượng cao nhất cho khách hàng.'
  },
  {
    icon: TrendingUp,
    title: 'Đổi mới',
    description: 'Không ngừng đầu tư nghiên cứu và phát triển công nghệ mới.'
  },
  {
    icon: Heart,
    title: 'Tận tâm',
    description: 'Phục vụ khách hàng với sự tận tâm và chu đáo nhất.'
  }
];

const AboutSection = () => {
  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium mb-6"
            >
              Về chúng tôi
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              25 năm kinh nghiệm trong ngành
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              TBS Group là tập đoàn đa ngành với 25 năm kinh nghiệm, chuyên về sản xuất túi xách, 
              da giày và các sản phẩm thời trang cao cấp. Chúng tôi tự hào là đối tác tin cậy 
              của nhiều thương hiệu nổi tiếng trên thế giới.
            </p>

            {/* Core Values */}
            <div className="space-y-6 mb-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {value.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Achievements Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              {achievements.map((achievement, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {achievement.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {achievement.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Images */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main Image */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src="/images/slider-02.jpg"
                alt="TBS Team"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              viewport={{ once: true }}
              className="absolute -bottom-8 -left-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-slate-700"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">ISO 9001:2015</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Chứng nhận chất lượng</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              viewport={{ once: true }}
              className="absolute -top-8 -right-8 bg-green-500 text-white rounded-2xl p-6 shadow-xl"
            >
              <div className="text-center">
                <div className="text-2xl font-bold">25+</div>
                <div className="text-sm opacity-90">Năm kinh nghiệm</div>
              </div>
            </motion.div>

            {/* Secondary Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              viewport={{ once: true }}
              className="absolute -bottom-4 -right-4 w-48 h-32 rounded-xl overflow-hidden shadow-lg"
            >
              <Image
                src="/images/slider-03.jpg"
                alt="TBS Factory"
                width={200}
                height={130}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
