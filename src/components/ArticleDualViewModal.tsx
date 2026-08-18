import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Languages,
  Globe,
  Send,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  ImageIcon,
  Columns2,
  Maximize2,
  Tag,
  CheckCircle2,
  Clock,
  Camera,
  Layers
} from 'lucide-react';
import { JoinedArticleNews } from '../types/client';

interface ArticleDualViewModalProps {
  article: JoinedArticleNews | null;
  isOpen: boolean;
  onClose: () => void;
  onTranslate?: (id: number) => Promise<any>;
  onDistribute?: (id: number, target: 'wordpress' | 'telegram' | 'both') => Promise<any>;
  onRefresh?: () => void;
}

export const ArticleDualViewModal: React.FC<ArticleDualViewModalProps> = ({
  article,
  isOpen,
  onClose,
  onTranslate,
  onDistribute,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'split' | 'original' | 'translated' | 'previews'>('split');
  const [articleDetail, setArticleDetail] = useState<{
    content?: string;
    translated_content?: string;
    translated_title?: string;
    summary?: string;
    meta_description?: string;
    suggested_titles?: string[] | string;
    tags?: string[] | string;
    featured_image?: string | null;
    original_url?: string;
    link?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch full article content and translation from API
  useEffect(() => {
    if (isOpen && article?.id) {
      setLoading(true);
      setActionNotice(null);
      fetch(`/api/news/${article.id}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setArticleDetail(json.data);
          } else {
            setArticleDetail({
              content: article.content,
              translated_content: article.translated_content,
              translated_title: article.translated_title,
              tags: article.tags,
              featured_image: article.featured_image,
              original_url: article.link || article.original_url,
            });
          }
        })
        .catch((err) => {
          console.error('Error fetching full article:', err);
          setArticleDetail({
            content: article.content,
            translated_content: article.translated_content,
            translated_title: article.translated_title,
            tags: article.tags,
            featured_image: article.featured_image,
            original_url: article.link || article.original_url,
          });
        })
        .finally(() => setLoading(false));
    } else {
      setArticleDetail(null);
    }
  }, [isOpen, article]);

  if (!isOpen || !article) return null;

  const originalContent = (articleDetail?.content || article.content || '').trim();
  const translatedContent = (articleDetail?.translated_content || article.translated_content || '').trim();
  const translatedTitle = articleDetail?.translated_title || article.translated_title || '';
  const originalTitle = article.title || '';
  const featuredImg = articleDetail?.featured_image || article.featured_image;
  const originalUrl = articleDetail?.original_url || article.link || article.original_url;

  const isTranslated = !!translatedTitle || !!translatedContent || article.translation_status === 'completed';
  const isWpPublished = article.wp_sync_status === 'published';
  const isTelegramPublished = article.telegram_sync_status === 'published';

  // Format Tags
  let tagsList: string[] = [];
  const rawTags = articleDetail?.tags || article.tags;
  if (Array.isArray(rawTags)) {
    tagsList = rawTags;
  } else if (typeof rawTags === 'string') {
    try {
      const parsed = JSON.parse(rawTags);
      tagsList = Array.isArray(parsed) ? parsed : [rawTags];
    } catch {
      tagsList = rawTags.split(/[,،]/).map((t) => t.trim()).filter(Boolean);
    }
  }

  // Copy to clipboard helper
  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Trigger Translation
  const handleTranslateNow = async () => {
    if (!onTranslate) return;
    setTranslating(true);
    setActionNotice('در حال ترجمه هوشمند با هوش مصنوعی...');
    try {
      await onTranslate(article.id);
      const res = await fetch(`/api/news/${article.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setArticleDetail(json.data);
      }
      setActionNotice('ترجمه هوشمند با موفقیت انجام و ذخیره شد.');
      if (onRefresh) onRefresh();
    } catch (e: any) {
      setActionNotice(`خطا در ترجمه: ${e.message}`);
    } finally {
      setTranslating(false);
    }
  };

  // Trigger Instant Distribution
  const handleDistributeNow = async () => {
    if (!onDistribute) return;
    setDistributing(true);
    setActionNotice('در حال انتشار خودکار در وردپرس و ارسال به تلگرام...');
    try {
      await onDistribute(article.id, 'both');
      setActionNotice('انتشار در وردپرس و تلگرام با موفقیت انجام شد!');
      if (onRefresh) onRefresh();
    } catch (e: any) {
      setActionNotice(`خطا در انتشار: ${e.message}`);
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div
        className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="bg-orange-500/20 text-orange-400 px-2.5 py-0.5 rounded-full font-bold border border-orange-500/30">
                {article.source_name || 'منبع خبر'}
              </span>
              <span className="text-slate-400 font-mono">شناسه #{article.id}</span>
              {isTranslated ? (
                <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ترجمه شده به فارسی
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  در صف ترجمه (متن اصلی)
                </span>
              )}
              {isWpPublished && (
                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold border border-purple-500/30">
                  وردپرس ✓
                </span>
              )}
              {isTelegramPublished && (
                <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold border border-sky-500/30">
                  تلگرام ✓
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-100 truncate">
              {translatedTitle || originalTitle}
            </h3>

            {translatedTitle && (
              <p className="text-xs text-slate-400 truncate dir-ltr text-right font-mono">
                {originalTitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
            aria-label="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & View Tabs Toolbar */}
        <div className="bg-slate-100/90 px-4 sm:px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-300 shadow-2xs">
            <button
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>مقایسه رو در رو (دو ستونه)</span>
            </button>

            <button
              onClick={() => setActiveTab('original')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'original'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>متن اصلی انگلیسی</span>
            </button>

            <button
              onClick={() => setActiveTab('translated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'translated'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>متن ترجمه شده فارسی</span>
            </button>

            <button
              onClick={() => setActiveTab('previews')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'previews'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>پیش‌نمایش خروجی‌ها</span>
            </button>
          </div>

          {/* Quick Actions in Modal Header */}
          <div className="flex items-center gap-2">
            {!isTranslated && onTranslate && (
              <button
                onClick={handleTranslateNow}
                disabled={translating}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {translating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{translating ? 'در حال ترجمه هوشمند...' : 'ترجمه هوشمند همین مقاله'}</span>
              </button>
            )}

            {isTranslated && onDistribute && (
              <button
                onClick={handleDistributeNow}
                disabled={distributing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {distributing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{distributing ? 'در حال ارسال...' : 'انتشار فوری (سایت و تلگرام)'}</span>
              </button>
            )}

            {originalUrl && (
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50 text-xs font-bold flex items-center gap-1"
                title="مشاهده خبر اصلی در وب‌سایت منبع"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">لینک منبع اصلی</span>
              </a>
            )}
          </div>
        </div>

        {/* Action Notice Alert Banner */}
        {actionNotice && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-2 text-xs font-bold text-indigo-900 flex items-center justify-between">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-indigo-400 hover:text-indigo-700 font-bold">&times;</button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-gray-700">در حال دریافت متن کامل و اطلاعات ترجمه...</p>
            </div>
          ) : (
            <>
              {/* Featured Image Bar if available */}
              {featuredImg && (
                <div className="mb-6 p-4 bg-white rounded-2xl border border-gray-200 flex items-center gap-4 shadow-2xs">
                  <img
                    src={featuredImg}
                    alt="Featured"
                    className="w-24 h-20 sm:w-32 sm:h-24 object-cover rounded-xl border border-gray-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>تصویر شاخص خبر (Featured Image)</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate font-mono dir-ltr text-right">
                      {featuredImg}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      این تصویر به طور خودکار به عنوان عکس اصلی در وردپرس، تلگرام و اینستاگرام استفاده می‌شود.
                    </p>
                  </div>
                </div>
              )}

              {/* VIEW 1: SIDE-BY-SIDE SPLIT VIEW */}
              {activeTab === 'split' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Persian Translated Version */}
                  <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                          <Languages className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">متن ترجمه شده به فارسی</h4>
                          <span className="text-[10px] text-emerald-600 font-medium">سئو و بازنویسی روان با AI</span>
                        </div>
                      </div>

                      {translatedContent && (
                        <button
                          onClick={() => handleCopy(translatedContent, 'translated')}
                          className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors"
                        >
                          {copiedSection === 'translated' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSection === 'translated' ? 'کپی شد' : 'کپی متن'}</span>
                        </button>
                      )}
                    </div>

                    {isTranslated ? (
                      <div className="space-y-4 flex-1">
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 block mb-1">عنوان فارسی:</label>
                          <h5 className="text-sm font-black text-gray-900 leading-snug bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                            {translatedTitle}
                          </h5>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-500 block mb-1">متن کامل مقاله فارسی:</label>
                          <div className="text-xs sm:text-sm text-gray-800 leading-relaxed font-sans text-justify bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-3 whitespace-pre-line max-h-96 overflow-y-auto">
                            {translatedContent || 'متنی برای این خبر ثبت نشده است.'}
                          </div>
                        </div>

                        {/* Tags */}
                        {tagsList.length > 0 && (
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">برچسب‌ها و تگ‌های سئو:</label>
                            <div className="flex flex-wrap gap-1.5">
                              {tagsList.map((tag, idx) => (
                                <span key={idx} className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-1 rounded-lg font-bold border border-emerald-200 flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-3 bg-amber-50/40 rounded-xl border border-dashed border-amber-200 my-auto">
                        <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
                        <p className="text-xs font-bold text-gray-800">این خبر هنوز به فارسی ترجمه نشده است.</p>
                        <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                          می‌توانید همین الان با کلیک بر روی دکمه زیر ترجمه هوشمند را آغاز کنید.
                        </p>
                        {onTranslate && (
                          <button
                            onClick={handleTranslateNow}
                            disabled={translating}
                            className="mt-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                          >
                            {translating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            <span>ترجمه فوری این مقاله</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Original Untranslated English Version */}
                  <div className="bg-white rounded-2xl p-5 border border-blue-200/80 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">متن کامل اصلی (ترجمه نشده)</h4>
                          <span className="text-[10px] text-blue-600 font-medium">استخراج شده مستقیم از وب‌سایت منبع</span>
                        </div>
                      </div>

                      {originalContent && (
                        <button
                          onClick={() => handleCopy(originalContent, 'original')}
                          className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors"
                        >
                          {copiedSection === 'original' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSection === 'original' ? 'کپی شد' : 'کپی متن'}</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-4 flex-1">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1">Original Title (عنوان اصلی):</label>
                        <h5 className="text-xs sm:text-sm font-bold text-gray-900 dir-ltr text-left bg-blue-50/50 p-3 rounded-xl border border-blue-100 font-mono">
                          {originalTitle}
                        </h5>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-gray-500">Original Full Article Text:</label>
                          <span className="text-[10px] font-mono text-gray-400">
                            {originalContent.split(/\s+/).length} Words ({originalContent.length} chars)
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-800 leading-relaxed font-sans dir-ltr text-left bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-3 whitespace-pre-line max-h-96 overflow-y-auto font-mono">
                          {originalContent || 'متن کامل هنوز استخراج نشده است.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: ORIGINAL FULL ARTICLE TAB */}
              {activeTab === 'original' && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h4 className="text-base font-bold text-gray-900">متن کامل اصلی خبر به زبان مبدأ (English Original)</h4>
                    <button
                      onClick={() => handleCopy(originalContent, 'original_tab')}
                      className="text-xs text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5"
                    >
                      {copiedSection === 'original_tab' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>کپی متن انگلیسی</span>
                    </button>
                  </div>

                  <div className="space-y-3 dir-ltr text-left">
                    <h3 className="text-lg font-bold text-gray-900">{originalTitle}</h3>
                    <div className="text-xs text-gray-500 font-mono">
                      Source: {article.source_name || 'RSS'} | URL: {originalUrl}
                    </div>
                    <hr className="border-gray-200" />
                    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line font-sans">
                      {originalContent || 'متن یافت نشد.'}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: TRANSLATED FULL ARTICLE TAB */}
              {activeTab === 'translated' && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h4 className="text-base font-bold text-gray-900">متن ترجمه شده به فارسی (Persian Translation)</h4>
                    {translatedContent && (
                      <button
                        onClick={() => handleCopy(translatedContent, 'translated_tab')}
                        className="text-xs text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5"
                      >
                        {copiedSection === 'translated_tab' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>کپی متن فارسی</span>
                      </button>
                    )}
                  </div>

                  {isTranslated ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-gray-900 leading-relaxed">{translatedTitle}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>ترجمه هوشمند هوش مصنوعی</span>
                        <span>•</span>
                        <span>آماده انتشار</span>
                      </div>
                      <hr className="border-gray-200" />
                      <div className="text-sm text-gray-800 leading-relaxed text-justify whitespace-pre-line">
                        {translatedContent}
                      </div>

                      {tagsList.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <span className="text-xs font-bold text-gray-500 block mb-2">برچسب‌ها:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {tagsList.map((tag, idx) => (
                              <span key={idx} className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-1 rounded-lg font-bold border border-emerald-200">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-16 text-center space-y-3">
                      <Clock className="w-10 h-10 text-amber-500 mx-auto" />
                      <p className="text-sm font-bold text-gray-800">این خبر هنوز ترجمه نشده است.</p>
                      {onTranslate && (
                        <button
                          onClick={handleTranslateNow}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>ترجمه فوری همین مقاله</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 4: OUTPUT CHANNEL PREVIEWS */}
              {activeTab === 'previews' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {/* Telegram Preview */}
                  <div className="bg-white rounded-2xl p-5 border border-sky-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                        <Send className="w-4 h-4" />
                        <span>پیش‌نمایش پست تلگرام (@updaaate_crypto)</span>
                      </div>
                      <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">شامل تصویر شاخص</span>
                    </div>

                    <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 space-y-2 text-xs text-gray-800">
                      {featuredImg && (
                        <img src={featuredImg} alt="Telegram preview" className="w-full h-40 object-cover rounded-lg mb-2" referrerPolicy="no-referrer" />
                      )}
                      <div className="font-bold text-sm text-gray-900">⚡️ {translatedTitle || originalTitle}</div>
                      <div className="text-gray-700 leading-relaxed text-xs">
                        {(translatedContent || originalContent).slice(0, 350)}...
                      </div>
                      <div className="pt-2 text-blue-600 underline text-[11px]">
                        🌐 مطالعه متن کامل در وب‌سایت
                      </div>
                      <div className="text-gray-400 text-[11px] pt-1">
                        {tagsList.map((t) => `#${t.replace(/\s+/g, '_')}`).join(' ')}
                      </div>
                    </div>
                  </div>

                  {/* Instagram Preview */}
                  <div className="bg-white rounded-2xl p-5 border border-pink-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-pink-700 font-bold text-sm">
                        <Camera className="w-4 h-4" />
                        <span>پیش‌نمایش پست اینستاگرام (@updaaate_ir)</span>
                      </div>
                      <span className="text-[10px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded font-bold">کپشن ساختاریافته</span>
                    </div>

                    <div className="bg-pink-50/40 p-4 rounded-xl border border-pink-100 space-y-2 text-xs text-gray-800 whitespace-pre-line">
                      {featuredImg && (
                        <img src={featuredImg} alt="Instagram preview" className="w-full h-40 object-cover rounded-lg mb-2" referrerPolicy="no-referrer" />
                      )}
                      <div className="font-bold text-gray-900">🔥 {translatedTitle || originalTitle}</div>
                      <div>
                        📊 خلاصه و نکات کلیدی:
                        {'\n'}▫️ {(translatedContent || originalContent).slice(0, 200)}...
                      </div>
                      <div className="text-pink-700 font-semibold">
                        🌐 جهت مطالعه تحلیل و گزارش کامل به وب‌سایت مراجعه کنید:
                        {'\n'}🔗 https://updaaate.ir/?p={article.id}
                      </div>
                      <div className="text-gray-400 text-[11px] pt-1">
                        #کریپتو #بیتکوین #ارز_دیجیتال #خبر_فوری
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 flex-wrap shrink-0 text-xs text-gray-500">
          <div>
            <span>منبع: {article.source_name || 'RSS'}</span>
            {article.created_at && (
              <span className="mr-2">• ثبت: {new Date(article.created_at).toLocaleDateString('fa-IR')}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
