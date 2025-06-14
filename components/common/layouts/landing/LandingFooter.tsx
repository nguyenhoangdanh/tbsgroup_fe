'use client';

import { motion } from 'framer-motion';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import ImageLogo from '../ImageLogo';

const footerSections = [
  {
    title: 'Sản phẩm',
    links: [
      { title: 'Túi xách', href: '/products/handbags' },
      { title: 'Balo', href: '/products/backpacks' },
      { title: 'Ví da', href: '/products/wallets' },
      { title: 'Phụ kiện', href: '/products/accessories' }
    ]
  },
  {
    title: 'Công ty',
    links: [
      { title: 'Giới thiệu', href: '/about' },
      { title: 'Tin tức', href: '/news' },
      { title: 'Tuyển dụng', href: '/careers' },
      { title: 'Đối tác', href: '/partners' }
    ]
  },
  {
    title: 'Hỗ trợ',
    links: [
      { title: 'Liên hệ', href: '/contact' },
      { title: 'Câu hỏi thường gặp', href: '/faq' },
      { title: 'Bảo hành', href: '/warranty' },
      { title: 'Chính sách đổi trả', href: '/return-policy' }
    ]
  }
];

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/tbsgroup', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/tbsgroup', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/tbsgroup', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/company/tbsgroup', label: 'LinkedIn' }
];

const contactInfo = [
  {
    icon: MapPin,
    title: 'Địa chỉ',
    content: 'Khu Công Nghiệp Thoại Sơn, An Giang, Việt Nam'
  },
  {
    icon: Phone,
    title: 'Điện thoại',
    content: '+84 296 3850 xxx'
  },
  {
    icon: Mail,
    title: 'Email',
    content: 'info@tbsgroup.vn'
  }
];

const LandingFooter = () => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <footer className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300">
      {/* Enhanced Background - Light theme chủ đạo */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300"></div>
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5 dark:opacity-10"></div>
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Enhanced Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="border-b border-gray-200 dark:border-slate-700"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium mb-6"
              >
                <Mail className="w-4 h-4 mr-2" />
                Newsletter
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                Đăng ký nhận tin tức
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg lg:text-xl mb-8 max-w-2xl mx-auto">
                Cập nhật những thông tin mới nhất về sản phẩm và ưu đãi đặc biệt từ TBS Group
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của bạn"
                  required
                  className="flex-1 h-12 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20"
                />
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5"
                    >
                      ⟳
                    </motion.div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Đăng ký
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Main Footer Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Enhanced Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div className="flex items-center space-x-3 mb-6">
                <ImageLogo
                  variant={theme === 'dark' ? 'dark' : 'light'}
                  className="h-12 w-auto"
                  width={120}
                  height={48}
                />
                <div>
                  <div className="font-bold text-xl text-slate-900 dark:text-white">Thoai Son</div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">Handbag Factory</div>
                </div>
              </div>
              
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-8 max-w-md">
                Với hơn 25 năm kinh nghiệm trong ngành sản xuất túi xách và da giày, 
                Thoai Son Handbag Factory tự hào là đối tác tin cậy của nhiều thương hiệu nổi tiếng thế giới.
              </p>

              {/* Enhanced Contact Info */}
              <div className="space-y-4">
                {contactInfo.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                    className="flex items-start space-x-4 group cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-300 mb-1">{item.title}</div>
                      <div className="text-slate-600 dark:text-slate-400 text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">{item.content}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Enhanced Footer Links */}
            {footerSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <motion.li
                      key={link.title}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: sectionIndex * 0.1 + linkIndex * 0.05, 
                        duration: 0.6 
                      }}
                      viewport={{ once: true }}
                    >
                      <Link
                        href={link.href}
                        className="text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-300 block py-1 hover:translate-x-1 group"
                      >
                        <span className="flex items-center">
                          {link.title}
                          <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Enhanced Bottom Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="border-t border-gray-200 dark:border-slate-700"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
              {/* Copyright */}
              <div className="text-slate-600 dark:text-slate-400 text-sm text-center lg:text-left">
                © {currentYear} Thoai Son Handbag Factory. Tất cả quyền được bảo lưu.
              </div>

              {/* Enhanced Social Links */}
              <div className="flex items-center space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gray-100 dark:bg-slate-800 hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-600 rounded-xl flex items-center justify-center transition-all duration-300 group border border-gray-200 dark:border-slate-700 shadow-sm"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <social.icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors duration-300" />
                  </motion.a>
                ))}
              </div>

              {/* Legal Links */}
              <div className="flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
                <Link href="/privacy" className="hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300">
                  Chính sách bảo mật
                </Link>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <Link href="/terms" className="hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300">
                  Điều khoản sử dụng
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default LandingFooter;
