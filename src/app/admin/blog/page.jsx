'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Trash2, Edit2, Save, X, Eye, 
  Image as ImageIcon, Tag, FileText, Upload, Youtube, Bold, Italic, List, Heading
} from 'lucide-react';
import Link from 'next/link';
import { BLOG_CATEGORIES, BLOG_ARTICLES } from '@/data/blogData';

// 本地儲存 key
const STORAGE_KEY = 'faw_blog_articles';
const IMAGES_STORAGE_KEY = 'faw_blog_images';

export default function BlogAdminPage() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [insertTarget, setInsertTarget] = useState(null); // 'cover' or 'content'
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // 格式化預約時間為 [Booking : 2026.01.07.AM12:30] 格式
  const formatBookingTime = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 變成 12
    return `Booking : ${year}.${month}.${day}.${ampm}${hours}:${minutes}`;
  };
  
  // 編輯表單狀態
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    categoryId: '',
    tags: '',
    image: '',
    content: '',
    status: 'draft',
    scheduledAt: ''
  });

  // 從 localStorage 載入文章和圖片
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setArticles(JSON.parse(stored));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(BLOG_ARTICLES));
        setArticles(BLOG_ARTICLES);
      }
      
      // 載入已上傳的圖片
      const storedImages = localStorage.getItem(IMAGES_STORAGE_KEY);
      if (storedImages) {
        setUploadedImages(JSON.parse(storedImages));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setArticles(BLOG_ARTICLES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 自動發布檢查 - 每分鐘檢查一次預約發布
  useEffect(() => {
    const checkScheduledPublish = () => {
      const now = new Date();
      let hasUpdates = false;
      
      const updatedArticles = articles.map(article => {
        // 檢查是否是 booking 狀態且時間已到
        if (article.status === 'booking' && article.scheduledAt) {
          const scheduledTime = new Date(article.scheduledAt);
          if (scheduledTime <= now) {
            // 時間到了，改為 published 並記錄發布時間
            hasUpdates = true;
            return { 
              ...article, 
              status: 'published',
              publishedAt: now.toISOString(),
              scheduledAt: null 
            };
          }
        }
        return article;
      });
      
      if (hasUpdates) {
        saveToStorage(updatedArticles);
      }
    };
    
    // 立即檢查一次
    if (articles.length > 0) {
      checkScheduledPublish();
    }
    
    // 每分鐘檢查一次
    const interval = setInterval(checkScheduledPublish, 60000);
    return () => clearInterval(interval);
  }, [articles]);

  // 儲存到 localStorage (加入錯誤處理)
  const saveToStorage = (newArticles) => {
    try {
      // 移除內容中過大的 Base64 圖片，只保留 URL
      const articlesToSave = newArticles.map(article => ({
        ...article,
        // 如果封面圖是 Base64 且太大，改用預設圖
        image: article.image?.length > 50000 ? '/blog/demo_1.png' : article.image,
        // 清理內容中過大的 Base64
        content: article.content?.replace(/!\[([^\]]*)\]\(data:image[^)]{50000,}\)/g, '![圖片](/blog/demo_1.png)')
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articlesToSave));
      setArticles(articlesToSave);
    } catch (error) {
      console.error('Storage error:', error);
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        alert('儲存空間不足！請刪除一些已上傳的圖片，或使用 URL 連結圖片而非上傳。');
      } else {
        alert('儲存失敗：' + error.message);
      }
    }
  };

  // 儲存圖片到 localStorage (加入錯誤處理和壓縮)
  const saveImagesToStorage = (images) => {
    try {
      // 限制儲存的圖片數量
      const limitedImages = images.slice(-10); // 只保留最近 10 張
      localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(limitedImages));
      setUploadedImages(limitedImages);
    } catch (error) {
      console.error('Image storage error:', error);
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        alert('圖片儲存空間不足！將自動清除舊圖片。');
        // 清除所有已上傳的圖片
        localStorage.removeItem(IMAGES_STORAGE_KEY);
        setUploadedImages([]);
      }
    }
  };

  // 壓縮圖片
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 處理圖片上傳 (加入壓縮)
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          // 壓縮圖片
          const compressedData = await compressImage(file);
          
          const newImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            data: compressedData,
            uploadedAt: new Date().toISOString()
          };
          
          const updated = [...uploadedImages, newImage];
          saveImagesToStorage(updated);
          
          // 如果是選擇封面圖，直接設定
          if (insertTarget === 'cover') {
            setFormData({ ...formData, image: compressedData });
            setShowImagePicker(false);
          }
        } catch (error) {
          console.error('Image upload error:', error);
          alert('圖片處理失敗，請重試');
        }
      }
    }
    
    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 插入圖片到內容
  const insertImageToContent = (imageUrl) => {
    if (insertTarget === 'cover') {
      setFormData({ ...formData, image: imageUrl });
    } else {
      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.content;
        const imageMarkdown = `\n![圖片](${imageUrl})\n`;
        const newContent = text.substring(0, start) + imageMarkdown + text.substring(end);
        setFormData({ ...formData, content: newContent });
      }
    }
    setShowImagePicker(false);
  };

  // 解析 YouTube URL 取得影片 ID
  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 插入 YouTube 影片
  const insertYoutube = () => {
    const videoId = getYoutubeId(youtubeUrl);
    if (videoId) {
      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.content;
        const youtubeEmbed = `\n[youtube:${videoId}]\n`;
        const newContent = text.substring(0, start) + youtubeEmbed + text.substring(end);
        setFormData({ ...formData, content: newContent });
      }
      setYoutubeUrl('');
      setShowYoutubeModal(false);
    }
  };

  // 插入格式化文字
  const insertFormat = (format) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const selectedText = text.substring(start, end);
    
    let newText = '';
    switch (format) {
      case 'bold':
        newText = `**${selectedText || '粗體文字'}**`;
        break;
      case 'italic':
        newText = `*${selectedText || '斜體文字'}*`;
        break;
      case 'heading':
        newText = `\n## ${selectedText || '標題'}\n`;
        break;
      case 'list':
        newText = `\n- ${selectedText || '列表項目'}\n`;
        break;
      default:
        return;
    }
    
    const newContent = text.substring(0, start) + newText + text.substring(end);
    setFormData({ ...formData, content: newContent });
  };

  // 刪除已上傳圖片
  const deleteUploadedImage = (imageId) => {
    const updated = uploadedImages.filter(img => img.id !== imageId);
    saveImagesToStorage(updated);
  };

  // 新增文章
  const handleNew = () => {
    setFormData({
      title: '',
      excerpt: '',
      categoryId: BLOG_CATEGORIES[0]?.id || '',
      tags: '',
      image: '/blog/demo_1.png',
      content: '',
      status: 'draft',
      scheduledAt: ''
    });
    setSelectedArticle(null);
    setIsEditing(true);
  };

  // 編輯文章
  const handleEdit = (article) => {
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      categoryId: article.categoryId,
      tags: article.tags.join(', '),
      image: article.image,
      content: article.content,
      status: article.status || 'draft',
      scheduledAt: article.scheduledAt || ''
    });
    setSelectedArticle(article);
    setIsEditing(true);
  };

  // 儲存文章
  const handleSave = () => {
    const now = new Date();
    
    // 根據狀態決定是否記錄發布時間
    let publishedAt = selectedArticle?.publishedAt || null;
    if (formData.status === 'published' && !publishedAt) {
      // 第一次發布，記錄發布時間
      publishedAt = now.toISOString();
    }
    
    const articleData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      updatedAt: now.toISOString(),
      scheduledAt: formData.status === 'booking' ? formData.scheduledAt : null,
      publishedAt: publishedAt
    };

    if (selectedArticle) {
      const updated = articles.map(a => 
        a.id === selectedArticle.id 
          ? { ...a, ...articleData }
          : a
      );
      saveToStorage(updated);
      setSelectedArticle({ ...selectedArticle, ...articleData });
    } else {
      const newArticle = {
        ...articleData,
        id: `article-${Date.now()}`,
        createdAt: now.toISOString()
      };
      saveToStorage([newArticle, ...articles]);
    }

    setIsEditing(false);
  };

  // 刪除文章
  const handleDelete = (id) => {
    const filtered = articles.filter(a => a.id !== id);
    saveToStorage(filtered);
    setShowDeleteConfirm(null);
    setSelectedArticle(null);
  };

  // 切換發布狀態 (只在 draft <-> published 之間切換)
  const toggleStatus = (article) => {
    const now = new Date();
    let newStatus;
    let publishedAt = article.publishedAt;
    
    if (article.status === 'published') {
      newStatus = 'draft';
    } else {
      // draft 或 booking 都可以直接發布
      newStatus = 'published';
      if (!publishedAt) {
        publishedAt = now.toISOString();
      }
    }
    
    const updatedArticle = { 
      ...article, 
      status: newStatus,
      scheduledAt: null,
      publishedAt: publishedAt
    };
    
    const updated = articles.map(a => 
      a.id === article.id ? updatedArticle : a
    );
    saveToStorage(updated);
    setSelectedArticle(updatedArticle);
  };

  // 重置為預設資料
  const handleReset = () => {
    if (confirm('確定要重置為預設文章？這將會覆蓋所有變更。')) {
      saveToStorage(BLOG_ARTICLES);
      setSelectedArticle(null);
    }
  };

  // 清除所有儲存空間
  const handleClearStorage = () => {
    if (confirm('確定要清除所有儲存的資料（包含文章和圖片）？這將釋放儲存空間。')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(IMAGES_STORAGE_KEY);
      setArticles(BLOG_ARTICLES);
      setUploadedImages([]);
      setSelectedArticle(null);
      alert('已清除所有儲存資料');
    }
  };

  const getCategoryColor = (categoryId) => {
    const cat = BLOG_CATEGORIES.find(c => c.id === categoryId);
    return cat?.color || '#00FF99';
  };

  const getCategoryName = (categoryId) => {
    const cat = BLOG_CATEGORIES.find(c => c.id === categoryId);
    return cat?.subtitle || 'Unknown';
  };

  // 預設圖片列表
  const defaultImages = [
    '/blog/demo_1.png',
    '/blog/demo_2.png',
    '/blog/demo_3.png',
    '/blog/demo_4.png',
    '/blog/demo_5.png',
    '/blog/demo_6.png',
    '/blog/demo_7.png',
    '/blog/demo_8.png',
  ];

  // Loading 狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#00FF99] font-mono text-lg animate-pulse mb-4">LOADING...</div>
          <div className="text-[#555] text-sm">正在載入後台管理</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#EAEAEA] font-mono">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-[#222] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm hover:text-[#00FF99] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            HOME
          </Link>
          <span className="text-xs tracking-widest">
            ADMIN<span className="text-[#333]">_PANEL</span>
          </span>
          <Link
            href="/blog"
            className="flex items-center gap-2 text-sm hover:text-[#00FF99] transition-colors"
          >
            <Eye className="w-4 h-4" />
            VIEW SITE
          </Link>
        </div>
      </header>

      <div className="pt-14 flex">
        {/* Sidebar - Article List */}
        <aside className="w-80 h-[calc(100vh-56px)] bg-[#050505] border-r border-[#222] flex flex-col">
          <div className="p-4 border-b border-[#222] flex items-center justify-between">
            <h2 className="text-sm font-bold">ARTICLES ({articles.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={handleClearStorage}
                className="text-xs text-red-500/60 hover:text-red-500 transition-colors"
                title="清除儲存空間"
              >
                Clear
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-[#555] hover:text-[#888] transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleNew}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#00FF99] text-black text-xs font-bold hover:bg-[#00CC7A] transition-colors"
              >
                <Plus className="w-3 h-3" />
                NEW
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {articles.map(article => {
              const isBooking = article.status === 'booking';
              const isLive = article.status === 'published';
              const isDraft = article.status === 'draft' || !article.status;
              
              return (
                <div
                  key={article.id}
                  className={`p-4 border-b border-[#222] cursor-pointer hover:bg-[#111] transition-colors ${
                    selectedArticle?.id === article.id && !isEditing ? 'bg-[#111] border-l-2 border-l-[#00FF99]' : ''
                  }`}
                  onClick={() => {
                    if (!isEditing) {
                      setSelectedArticle(article);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span 
                      className="px-2 py-0.5 text-[10px]"
                      style={{ backgroundColor: getCategoryColor(article.categoryId), color: '#000' }}
                    >
                      {getCategoryName(article.categoryId)}
                    </span>
                    <span className={`text-[10px] ${isLive ? 'text-[#00FF99]' : isBooking ? 'text-yellow-500' : 'text-[#888]'}`}>
                      {isLive ? '● LIVE' : isBooking ? '⏰ BOOKED' : '○ DRAFT'}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-[10px] text-[#555]">
                    {article.date}
                  </p>
                  {isBooking && article.scheduledAt && (
                    <p className="text-[10px] text-yellow-500 mt-1">
                      [{formatBookingTime(article.scheduledAt)}]
                    </p>
                  )}
                  {isLive && article.publishedAt && (
                    <p className="text-[10px] text-[#00FF99] mt-1">
                      Published: {new Date(article.publishedAt).toLocaleDateString('zh-TW')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-[calc(100vh-56px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            {isEditing ? (
              // Edit Form
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">
                      {selectedArticle ? 'EDIT ARTICLE' : 'NEW ARTICLE'}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          if (!selectedArticle) setSelectedArticle(null);
                        }}
                        className="flex items-center gap-1 px-4 py-2 border border-[#333] text-sm hover:border-[#555] transition-colors"
                      >
                        <X className="w-4 h-4" />
                        CANCEL
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1 px-4 py-2 bg-[#00FF99] text-black text-sm font-bold hover:bg-[#00CC7A] transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        SAVE
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-xs text-[#888] mb-2">
                        <FileText className="w-3 h-3 inline mr-1" />
                        TITLE
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                        placeholder="Article title..."
                      />
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#888] mb-2">CATEGORY</label>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                        >
                          {BLOG_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.subtitle}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#888] mb-2">STATUS</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value, scheduledAt: e.target.value === 'booking' ? formData.scheduledAt : '' })}
                          className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                        >
                          <option value="draft">Draft (草稿)</option>
                          <option value="booking">Booking (預約發布)</option>
                          <option value="published">Published (已發布)</option>
                        </select>
                      </div>
                    </div>

                    {/* Scheduled Publish - 只有 booking 狀態可以設定時間 */}
                    {formData.status === 'booking' && (
                      <div>
                        <label className="block text-xs text-[#888] mb-2">
                          📅 BOOKING TIME (選擇預約發布時間)
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.scheduledAt}
                          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                          className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                        />
                        {formData.scheduledAt && (
                          <p className="text-xs text-yellow-500 mt-2">
                            ⏰ 將於 {new Date(formData.scheduledAt).toLocaleString('zh-TW')} 自動發布
                          </p>
                        )}
                        {!formData.scheduledAt && (
                          <p className="text-xs text-red-500 mt-2">
                            ⚠️ 請選擇預約發布時間
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Published info */}
                    {formData.status === 'published' && selectedArticle?.publishedAt && (
                      <div className="bg-[#111] border border-[#333] p-4">
                        <p className="text-xs text-[#00FF99]">
                          ✓ 首次發布時間: {new Date(selectedArticle.publishedAt).toLocaleString('zh-TW')}
                        </p>
                      </div>
                    )}

                    {/* Cover Image */}
                    <div>
                      <label className="block text-xs text-[#888] mb-2">
                        <ImageIcon className="w-3 h-3 inline mr-1" />
                        COVER IMAGE
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          className="flex-1 bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                          placeholder="Image URL or upload..."
                        />
                        <button
                          onClick={() => {
                            setInsertTarget('cover');
                            setShowImagePicker(true);
                          }}
                          className="px-4 py-3 bg-[#222] border border-[#333] hover:border-[#555] transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                      {formData.image && (
                        <div className="mt-3 border border-[#222] p-2">
                          <img 
                            src={formData.image} 
                            alt="Cover Preview" 
                            className="w-full max-w-md h-40 object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-xs text-[#888] mb-2">
                        <Tag className="w-3 h-3 inline mr-1" />
                        TAGS (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                        placeholder="design, tech, marketing"
                      />
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className="block text-xs text-[#888] mb-2">EXCERPT</label>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        rows={3}
                        className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99] resize-none"
                        placeholder="Brief description of the article..."
                      />
                    </div>

                    {/* Content Editor */}
                    <div>
                      <label className="block text-xs text-[#888] mb-2">
                        CONTENT
                      </label>
                      
                      {/* Toolbar */}
                      <div className="flex gap-1 mb-2 p-2 bg-[#111] border border-[#333] border-b-0">
                        <button
                          onClick={() => insertFormat('heading')}
                          className="p-2 hover:bg-[#222] transition-colors"
                          title="Heading"
                        >
                          <Heading className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => insertFormat('bold')}
                          className="p-2 hover:bg-[#222] transition-colors"
                          title="Bold"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => insertFormat('italic')}
                          className="p-2 hover:bg-[#222] transition-colors"
                          title="Italic"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => insertFormat('list')}
                          className="p-2 hover:bg-[#222] transition-colors"
                          title="List"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <div className="w-px bg-[#333] mx-1" />
                        <button
                          onClick={() => {
                            setInsertTarget('content');
                            setShowImagePicker(true);
                          }}
                          className="p-2 hover:bg-[#222] transition-colors flex items-center gap-1"
                          title="Insert Image"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-xs">圖片</span>
                        </button>
                        <button
                          onClick={() => setShowYoutubeModal(true)}
                          className="p-2 hover:bg-[#222] transition-colors flex items-center gap-1"
                          title="Insert YouTube"
                        >
                          <Youtube className="w-4 h-4 text-red-500" />
                          <span className="text-xs">YouTube</span>
                        </button>
                      </div>
                      
                      <textarea
                        ref={contentRef}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={20}
                        className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00FF99] resize-none"
                        placeholder="Write your article content here..."
                      />
                      <p className="text-[10px] text-[#555] mt-2">
                        Tip: 使用 ## 標題、**粗體**、*斜體*、- 列表、![alt](url) 圖片、[youtube:VIDEO_ID] YouTube 影片
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : selectedArticle ? (
              // Article Preview
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <div className="max-w-4xl mx-auto">
                  {(() => {
                    const isBooking = selectedArticle.status === 'booking';
                    const isLive = selectedArticle.status === 'published';
                    const isDraft = selectedArticle.status === 'draft' || !selectedArticle.status;
                    
                    return (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-lg font-bold">ARTICLE PREVIEW</h2>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleStatus(selectedArticle)}
                              className={`px-4 py-2 text-sm border transition-colors ${
                                isLive
                                  ? 'border-[#00FF99] text-[#00FF99]'
                                  : isBooking
                                  ? 'border-yellow-500 text-yellow-500'
                                  : 'border-[#333] text-[#888] hover:border-[#555]'
                              }`}
                            >
                              {isLive ? 'UNPUBLISH' : isBooking ? 'BOOKED' : 'PUBLISH NOW'}
                            </button>
                            <button
                              onClick={() => handleEdit(selectedArticle)}
                              className="flex items-center gap-1 px-4 py-2 border border-[#333] text-sm hover:border-[#555] transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                              EDIT
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(selectedArticle.id)}
                              className="flex items-center gap-1 px-4 py-2 border border-red-500/50 text-red-500 text-sm hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              DELETE
                            </button>
                          </div>
                        </div>

                        {/* Preview Content */}
                        <div className="bg-[#0A0A0A] border border-[#222]">
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={selectedArticle.image} 
                              alt={selectedArticle.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-6">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <span 
                                className="px-2 py-0.5 text-[10px]"
                                style={{ backgroundColor: getCategoryColor(selectedArticle.categoryId), color: '#000' }}
                              >
                                {getCategoryName(selectedArticle.categoryId)}
                              </span>
                              <span className="text-xs text-[#555]">{selectedArticle.date}</span>
                              <span className={`text-xs ${isLive ? 'text-[#00FF99]' : isBooking ? 'text-yellow-500' : 'text-[#888]'}`}>
                                {isLive ? '● Published' : isBooking ? `[${formatBookingTime(selectedArticle.scheduledAt)}]` : '○ Draft'}
                              </span>
                              {isLive && selectedArticle.publishedAt && (
                                <span className="text-xs text-[#555]">
                                  (首次發布: {new Date(selectedArticle.publishedAt).toLocaleDateString('zh-TW')})
                                </span>
                              )}
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-4">{selectedArticle.title}</h1>
                            <p className="text-[#888] mb-4">{selectedArticle.excerpt}</p>
                            <div className="flex gap-2 mb-6">
                              {selectedArticle.tags?.map((tag, i) => (
                                <span key={i} className="text-xs text-[#555]">#{tag}</span>
                              ))}
                            </div>
                            <div className="border-t border-[#222] pt-6">
                              <ArticleContentPreview content={selectedArticle.content} />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            ) : (
              // Empty State
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center"
              >
                <div className="text-center">
                  <FileText className="w-16 h-16 text-[#333] mx-auto mb-4" />
                  <p className="text-[#555] mb-4">SELECT AN ARTICLE TO PREVIEW</p>
                  <button
                    onClick={handleNew}
                    className="flex items-center gap-1 px-4 py-2 bg-[#00FF99] text-black text-sm font-bold hover:bg-[#00CC7A] transition-colors mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    CREATE NEW ARTICLE
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Image Picker Modal */}
      <AnimatePresence>
        {showImagePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowImagePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#111] border border-[#333] p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  {insertTarget === 'cover' ? 'SELECT COVER IMAGE' : 'INSERT IMAGE'}
                </h3>
                <button onClick={() => setShowImagePicker(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Upload Section */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-[#333] hover:border-[#00FF99] cursor-pointer transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span>點擊上傳圖片或拖放檔案</span>
                </label>
              </div>
              
              {/* Uploaded Images */}
              {uploadedImages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm text-[#888] mb-3">已上傳的圖片</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {uploadedImages.map(img => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.data}
                          alt={img.name}
                          className="w-full aspect-square object-cover cursor-pointer border border-[#333] hover:border-[#00FF99] transition-colors"
                          onClick={() => insertImageToContent(img.data)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUploadedImage(img.id);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Default Images */}
              <div>
                <h4 className="text-sm text-[#888] mb-3">預設圖片</h4>
                <div className="grid grid-cols-4 gap-3">
                  {defaultImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Default ${i + 1}`}
                      className="w-full aspect-square object-cover cursor-pointer border border-[#333] hover:border-[#00FF99] transition-colors"
                      onClick={() => insertImageToContent(img)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube Modal */}
      <AnimatePresence>
        {showYoutubeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowYoutubeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#111] border border-[#333] p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  INSERT YOUTUBE VIDEO
                </h3>
                <button onClick={() => setShowYoutubeModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-[#0A0A0A] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99] mb-4"
              />
              
              {/* Preview */}
              {getYoutubeId(youtubeUrl) && (
                <div className="mb-4">
                  <p className="text-xs text-[#555] mb-2">PREVIEW</p>
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYoutubeId(youtubeUrl)}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowYoutubeModal(false)}
                  className="px-4 py-2 border border-[#333] text-sm hover:border-[#555] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={insertYoutube}
                  disabled={!getYoutubeId(youtubeUrl)}
                  className="px-4 py-2 bg-[#00FF99] text-black text-sm font-bold hover:bg-[#00CC7A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  INSERT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#111] border border-[#333] p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">DELETE ARTICLE?</h3>
              <p className="text-sm text-[#888] mb-6">
                This action cannot be undone. The article will be permanently removed.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-[#333] text-sm hover:border-[#555] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  DELETE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 文章內容預覽元件 - 支援圖片和 YouTube
function ArticleContentPreview({ content }) {
  if (!content) return null;
  
  const lines = content.split('\n');
  
  return (
    <div className="prose prose-invert max-w-none">
      {lines.map((line, index) => {
        // YouTube embed
        const youtubeMatch = line.match(/\[youtube:([a-zA-Z0-9_-]+)\]/);
        if (youtubeMatch) {
          return (
            <div key={index} className="my-4 aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          );
        }
        
        // Image
        const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
          return (
            <div key={index} className="my-4">
              <img 
                src={imageMatch[2]} 
                alt={imageMatch[1]} 
                className="max-w-full h-auto"
              />
              {imageMatch[1] && (
                <p className="text-xs text-[#555] mt-1">{imageMatch[1]}</p>
              )}
            </div>
          );
        }
        
        // Heading
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-xl font-bold text-white mt-6 mb-3">
              {line.substring(3)}
            </h2>
          );
        }
        
        // List item
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="text-[#888] ml-4">
              {line.substring(2)}
            </li>
          );
        }
        
        // Bold and italic
        let text = line;
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Empty line
        if (!line.trim()) {
          return <br key={index} />;
        }
        
        return (
          <p 
            key={index} 
            className="text-[#888] mb-2"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
      })}
    </div>
  );
}
