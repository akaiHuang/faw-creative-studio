'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Award, Users, Briefcase, TrendingUp, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

/**
 * 品牌經驗區塊
 * 展示過去合作的品牌 Logo、作品照片
 */

// 合作品牌數據（示例）
const BRANDS = [
  { id: 1, name: 'Brand A', logo: '🏢', industry: 'Tech' },
  { id: 2, name: 'Brand B', logo: '🎮', industry: 'Gaming' },
  { id: 3, name: 'Brand C', logo: '🛍️', industry: 'Retail' },
  { id: 4, name: 'Brand D', logo: '🎬', industry: 'Entertainment' },
  { id: 5, name: 'Brand E', logo: '🏦', industry: 'Finance' },
  { id: 6, name: 'Brand F', logo: '✈️', industry: 'Travel' },
  { id: 7, name: 'Brand G', logo: '🍔', industry: 'F&B' },
  { id: 8, name: 'Brand H', logo: '👟', industry: 'Sports' },
  { id: 9, name: 'Brand I', logo: '💄', industry: 'Beauty' },
  { id: 10, name: 'Brand J', logo: '🚗', industry: 'Automotive' },
  { id: 11, name: 'Brand K', logo: '🏥', industry: 'Healthcare' },
  { id: 12, name: 'Brand L', logo: '📱', industry: 'Mobile' },
];

// 精選作品數據
const FEATURED_WORKS = [
  {
    id: 1,
    title: '品牌年度活動網站',
    client: '國際運動品牌',
    type: 'Interactive Web',
    year: '2024',
    description: '結合 WebGL 與即時數據視覺化，打造沉浸式的品牌體驗網站',
    stats: { visitors: '500K+', engagement: '4.2min', conversion: '23%' },
    color: '#00FF99',
    image: '/blog/demo_1.png',
  },
  {
    id: 2,
    title: '社群互動遊戲',
    client: '知名餐飲集團',
    type: 'Social Game',
    year: '2024',
    description: 'LINE OA 整合的抽獎遊戲，帶動社群互動與門市導流',
    stats: { participants: '120K+', shares: '45K+', redemption: '68%' },
    color: '#FF004D',
    image: '/blog/demo_2.png',
  },
  {
    id: 3,
    title: 'AI 客服系統',
    client: '金融科技公司',
    type: 'AI Solution',
    year: '2024',
    description: '導入 Gemini API 的智能客服，大幅提升客戶服務效率',
    stats: { queries: '1M+', accuracy: '94%', satisfaction: '4.8/5' },
    color: '#00BFFF',
    image: '/blog/demo_3.png',
  },
  {
    id: 4,
    title: '元宇宙展覽空間',
    client: '藝術基金會',
    type: '3D Experience',
    year: '2024',
    description: '打造虛擬藝廊空間，讓全球觀眾能身歷其境欣賞展品',
    stats: { visitors: '280K+', avgTime: '8.5min', countries: '42' },
    color: '#FFD700',
    image: '/blog/demo_4.png',
  },
  {
    id: 5,
    title: '智能推薦引擎',
    client: '電商平台',
    type: 'ML System',
    year: '2024',
    description: '基於用戶行為的個人化推薦系統，提升轉換率與客單價',
    stats: { orders: '2.5M+', uplift: '156%', retention: '89%' },
    color: '#FF6B00',
    image: '/blog/demo_5.png',
  },
  {
    id: 6,
    title: 'AR 試妝體驗',
    client: '國際美妝品牌',
    type: 'AR Application',
    year: '2024',
    description: '即時 AR 試妝功能，讓消費者在線上就能體驗產品效果',
    stats: { tryOns: '850K+', conversion: '34%', shares: '120K+' },
    color: '#FF004D',
    image: '/blog/demo_6.png',
  },
];

// 服務能力數據
const CAPABILITIES = [
  {
    icon: Users,
    title: '品牌合作',
    value: '50+',
    description: '跨產業客戶信賴',
  },
  {
    icon: Briefcase,
    title: '專案完成',
    value: '200+',
    description: '從概念到上線',
  },
  {
    icon: Award,
    title: '獲獎肯定',
    value: '15+',
    description: '國內外設計獎項',
  },
  {
    icon: TrendingUp,
    title: '平均成效',
    value: '340%',
    description: '互動率提升',
  },
];

// Logo 輪播元件
const BrandLogoCarousel = () => {
  const [hoveredId, setHoveredId] = useState(null);
  
  return (
    <div className="relative overflow-hidden py-8">
      {/* 漸層遮罩 */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050505] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050505] to-transparent z-10" />
      
      {/* 滾動容器 */}
      <motion.div
        className="flex gap-8"
        animate={{ x: [0, -1920] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          },
        }}
      >
        {/* 重複兩次以實現無縫滾動 */}
        {[...BRANDS, ...BRANDS].map((brand, index) => (
          <div
            key={`${brand.id}-${index}`}
            className="flex-shrink-0 w-32 h-32 border border-[#222] bg-[#0A0A0A] 
                       flex flex-col items-center justify-center
                       hover:border-[#00FF99] transition-all duration-300 cursor-pointer group"
            onMouseEnter={() => setHoveredId(`${brand.id}-${index}`)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span className="text-4xl mb-2 grayscale group-hover:grayscale-0 transition-all">
              {brand.logo}
            </span>
            <span className="text-[10px] font-mono text-[#555] group-hover:text-[#00FF99]">
              {brand.industry}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// 作品卡片元件
const WorkCard = ({ work, index, disableAnimation = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={cardRef}
      initial={disableAnimation ? false : { opacity: 0, y: 30 }}
      animate={disableAnimation ? {} : (isInView ? { opacity: 1, y: 0 } : {})}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="border border-[#222] bg-[#0A0A0A] overflow-hidden">
        {/* 頂部裝飾條 */}
        <div className="h-1" style={{ backgroundColor: work.color }} />
        
        {/* 圖片區域 */}
        <div className="relative aspect-video bg-[#111] overflow-hidden">
          {/* 實際圖片 */}
          {work.image && (
            <img 
              src={work.image}
              alt={work.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
          
          {/* 漸層遮罩 */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)`,
            }}
          />
          
          {/* Hover 覆蓋層 */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: work.color + 'DD' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-black font-bold text-sm flex items-center gap-2">
              VIEW PROJECT <ExternalLink className="w-4 h-4" />
            </span>
          </motion.div>
          
          {/* 角落標籤 */}
          <div className="absolute top-4 left-4 text-[10px] font-mono px-2 py-1 bg-black/50 backdrop-blur-sm" style={{ color: work.color }}>
            {work.type}
          </div>
          <div className="absolute top-4 right-4 text-[10px] font-mono text-white px-2 py-1 bg-black/50 backdrop-blur-sm">
            {work.year}
          </div>
        </div>
        
        {/* 內容區域 */}
        <div className="p-6">
          <div className="text-[10px] font-mono text-[#666] mb-2 tracking-wider">
            {work.client}
          </div>
          <h4 className="text-xl font-bold text-white mb-3 group-hover:text-[#00FF99] transition-colors">
            {work.title}
          </h4>
          <p className="text-sm text-[#666] mb-6 line-clamp-2">
            {work.description}
          </p>
          
          {/* 成效數據 */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#222]">
            {Object.entries(work.stats).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-lg font-bold" style={{ color: work.color }}>
                  {value}
                </div>
                <div className="text-[10px] font-mono text-[#555] uppercase">
                  {key}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 能力數據卡片
const CapabilityCard = ({ capability, index }) => {
  const IconComponent = capability.icon;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: index * 0.1 }}
      className="border border-[#222] bg-[#0A0A0A] p-6 text-center group hover:border-[#00FF99] transition-colors"
    >
      <IconComponent className="w-8 h-8 mx-auto mb-4 text-[#555] group-hover:text-[#00FF99] transition-colors" />
      <div className="text-3xl font-bold text-white mb-1">{capability.value}</div>
      <div className="text-sm font-bold text-[#888] mb-1">{capability.title}</div>
      <div className="text-[10px] font-mono text-[#555]">{capability.description}</div>
    </motion.div>
  );
};

// 主要品牌經驗區塊
const BrandExperience = () => {
  const sectionRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  
  // 根據螢幕尺寸決定每頁數量：iPad(md) = 4, 桌機(lg) = 3
  const [itemsPerPage, setItemsPerPage] = useState(4);
  
  // 監聽螢幕尺寸變化
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(3); // lg: 桌機 3 個
      } else {
        setItemsPerPage(4); // md: iPad 4 個
      }
    };
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);
  
  const totalPages = Math.ceil(FEATURED_WORKS.length / itemsPerPage);
  
  // 確保 currentPage 不超出範圍
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);
  
  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };
  
  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };
  
  // 手機版滾動監聽
  const handleScroll = (e) => {
    const container = e.target;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth * 0.85 + 16; // 85vw + gap
    const newIndex = Math.round(scrollLeft / cardWidth);
    setMobileIndex(Math.min(newIndex, FEATURED_WORKS.length - 1));
  };
  
  // 點擊導航點跳轉
  const scrollToIndex = (index) => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.offsetWidth * 0.85 + 16;
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };
  
  // 取得目前頁面的作品
  const currentWorks = FEATURED_WORKS.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  
  return (
    <section id="experience" className="bg-[#050505] border-t border-[#222]">
      {/* Section Header */}
      <div className="border-b border-[#222] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-px bg-[#FF004D]" />
            <span className="text-[10px] font-mono text-[#FF004D] tracking-[0.3em]">
              TRACK RECORD
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                品牌經驗
              </h2>
              <p className="text-[#666] mt-2 text-sm md:text-base max-w-2xl">
                我們與眾多品牌攜手，打造令人印象深刻的數位體驗。
                每一個專案都是我們對創新與品質的承諾。
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 合作品牌 Logo 滾動 */}
      <div className="border-b border-[#222] py-8">
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <h3 className="text-xs font-mono text-[#555] tracking-widest">
            // TRUSTED BY
          </h3>
        </div>
        <BrandLogoCarousel />
      </div>
      
      {/* 能力數據 */}
      <div className="border-b border-[#222] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CAPABILITIES.map((cap, index) => (
              <CapabilityCard key={index} capability={cap} index={index} />
            ))}
          </div>
        </div>
      </div>
      
      {/* 精選作品 */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xs font-mono text-[#555] tracking-widest mb-2">
                // FEATURED WORKS
              </h3>
              <h4 className="text-2xl font-bold text-white">精選作品</h4>
            </div>
            {/* 桌面版按鈕 */}
            <div className="hidden md:flex gap-2">
              <button 
                onClick={handlePrev}
                className="w-10 h-10 border border-[#333] flex items-center justify-center hover:border-[#00FF99] hover:text-[#00FF99] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNext}
                className="w-10 h-10 border border-[#333] flex items-center justify-center hover:border-[#00FF99] hover:text-[#00FF99] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* 手機版：橫向滾動 with snap */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
              {FEATURED_WORKS.map((work, index) => (
                <div key={work.id} className="w-[85vw] flex-shrink-0 snap-center">
                  <WorkCard work={work} index={index} disableAnimation={true} />
                </div>
              ))}
            </div>
          </div>
          
          {/* 手機版導航點 */}
          <div className="md:hidden flex items-center justify-center gap-2 mt-6">
            {FEATURED_WORKS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === mobileIndex 
                    ? 'w-6 bg-[#00FF99]' 
                    : 'w-2 bg-[#333]'
                }`}
              />
            ))}
          </div>
          
          {/* 桌面版：分頁顯示 */}
          <motion.div 
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="hidden md:grid md:grid-cols-4 lg:grid-cols-3 gap-6"
          >
            {currentWorks.map((work, index) => (
              <WorkCard key={work.id} work={work} index={index} />
            ))}
          </motion.div>
          
          {/* 桌面版分頁指示點 */}
          <div className="hidden md:flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentPage 
                    ? 'w-8 bg-[#00FF99]' 
                    : 'bg-[#333] hover:bg-[#555]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA 區域 */}
      <div className="border-t border-[#222] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            準備好開始您的專案了嗎？
          </h3>
          <p className="text-[#666] mb-8 text-sm md:text-base">
            無論是品牌網站、互動行銷、還是 AI 解決方案，
            <br className="hidden md:block" />
            我們都能為您打造最適合的數位體驗。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-[#00FF99] text-black font-bold hover:bg-white transition-colors">
              預約諮詢
            </button>
            <button className="px-8 py-3 border border-[#333] text-white hover:border-[#00FF99] hover:text-[#00FF99] transition-colors">
              下載作品集 PDF
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandExperience;
