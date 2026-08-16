import React, { useState } from 'react';
import { JoinedArticleNews } from '../types/client';
import { 
  FastForward, 
  Trash2, 
  SplitSquareHorizontal, 
  Wand2, 
  Edit3, 
  ImageIcon, 
  Users, 
  MessageSquare, 
  History, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Save,
  Send,
  ArrowRight,
  Filter,
  Archive,
  RefreshCw
} from 'lucide-react';
import { NewsFeedTab } from './NewsFeedTab';

// 1. Smart Queue (در صف ترجمه)
export const SmartQueueTab: React.FC<{ 
  news: JoinedArticleNews[];
  loading: boolean;
  onRefresh: () => void;
  onTriggerScraper: () => void;
  onTriggerTranslator: () => void;
  onTranslateArticle: (id: number, model?: string) => Promise<any>;
  onDeleteArticle: (id: number) => void;
  onCreateCustomArticle: (title: string, content: string, model?: string) => Promise<boolean>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
}> = (props) => {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">مدیریت هوشمند صف (Smart Queue)</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              تخمین زمان پردازش کل صف: <span className="font-bold text-amber-700">تقریباً {Math.ceil(props.news.length * 0.5)} دقیقه</span> (با توجه به ترافیک سرور)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-2 flex-1 md:flex-none justify-center">
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>حذف گروهی هرزنامه‌ها</span>
          </button>
          <button
            onClick={props.onTriggerTranslator}
            disabled={props.isTriggeringTranslator}
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 flex-1 md:flex-none justify-center"
          >
            <FastForward className={`w-4 h-4 ${props.isTriggeringTranslator ? 'animate-pulse' : ''}`} />
            <span>Fast-Track هوش مصنوعی</span>
          </button>
        </div>
      </div>

      <NewsFeedTab {...props} />
    </div>
  );
};

// 2. Review Studio (استودیوی ویرایش و بررسی)
export const ReviewStudioTab: React.FC<{ 
  news: JoinedArticleNews[];
}> = ({ news }) => {
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(news.length > 0 ? news[0].id : null);
  const [detailsMap, setDetailsMap] = useState<Record<number, { content?: string; translated_content?: string; translated_title?: string; featured_image?: string; suggested_titles?: string[] | string; tags?: string[] | string }>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedArticleId && !detailsMap[selectedArticleId]) {
      setLoadingDetail(true);
      fetch(`/api/news/${selectedArticleId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setDetailsMap(prev => ({ ...prev, [selectedArticleId]: data.data }));
          }
        })
        .finally(() => setLoadingDetail(false));
    }
  }, [selectedArticleId, detailsMap]);

  const baseArticle = news.find(n => n.id === selectedArticleId);
  const detailedArticle = selectedArticleId ? detailsMap[selectedArticleId] : null;

  const currentTitle = detailedArticle?.translated_title !== undefined 
    ? detailedArticle.translated_title 
    : (baseArticle?.translated_title || '');

  const fullContent = detailedArticle?.content || baseArticle?.content || '';
  const fullTranslatedContent = detailedArticle?.translated_content || baseArticle?.translated_content || '';
  const featuredImage = detailedArticle?.featured_image || baseArticle?.featured_image;

  // Normalize suggested titles
  let rawTitles = detailedArticle?.suggested_titles || baseArticle?.suggested_titles;
  let suggestedTitles: string[] = [];
  if (Array.isArray(rawTitles)) {
    suggestedTitles = rawTitles;
  } else if (typeof rawTitles === 'string') {
    try {
      const parsed = JSON.parse(rawTitles);
      suggestedTitles = Array.isArray(parsed) ? parsed : [rawTitles];
    } catch {
      suggestedTitles = [rawTitles];
    }
  }

  // Normalize tags
  let rawTags = detailedArticle?.tags || baseArticle?.tags;
  let tags: string[] = [];
  if (Array.isArray(rawTags)) {
    tags = rawTags;
  } else if (typeof rawTags === 'string') {
    try {
      const parsed = JSON.parse(rawTags);
      tags = Array.isArray(parsed) ? parsed : [rawTags];
    } catch {
      tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  const handleApplyTitle = (newTitle: string) => {
    if (!selectedArticleId) return;
    setDetailsMap(prev => ({
      ...prev,
      [selectedArticleId]: {
        ...prev[selectedArticleId],
        translated_title: newTitle
      }
    }));
  };

  const handleDistribute = async () => {
    if (!selectedArticleId) return;
    setIsPublishing(true);
    setPublishStatus(null);
    try {
      const res = await fetch(`/api/news/${selectedArticleId}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: ['wordpress', 'telegram'] })
      });
      const data = await res.json();
      if (data.success) {
        setPublishStatus('✅ با موفقیت در وردپرس و تلگرام منتشر شد!');
        setDetailsMap(prev => ({ ...prev }));
      } else {
        setPublishStatus('❌ خطا در انتشار: ' + (data.error || 'پاسخ ناموفق'));
      }
    } catch (err) {
      console.error('Publishing error:', err);
      setPublishStatus('❌ خطا در ارتباط با سرور');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {!selectedArticleId ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
           <SplitSquareHorizontal className="w-12 h-12 mx-auto text-gray-300 mb-3" />
           <p className="text-sm font-bold">خبری برای بررسی انتخاب نشده است</p>
           <p className="text-xs mt-1">یک خبر از لیست انتخاب کنید تا وارد استودیوی ویرایش شوید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
           {/* Sidebar: News List */}
           <div className="xl:col-span-3 bg-white border border-gray-200 rounded-2xl overflow-hidden h-[600px] flex flex-col">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                 <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> اخبار نیازمند تایید
                 </h4>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-2">
                 {news.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setSelectedArticleId(item.id);
                        setPublishStatus(null);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedArticleId === item.id 
                          ? 'bg-emerald-50 border-emerald-200 shadow-xs' 
                          : 'bg-white border-gray-100 hover:border-emerald-200'
                      }`}
                    >
                       <p className="font-bold text-gray-900 line-clamp-2 leading-relaxed">{item.translated_title || item.title}</p>
                       <span className="text-[10px] text-gray-400 mt-2 block">{new Date(item.published_at || '').toLocaleTimeString('fa-IR')}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Main Editor Area */}
           <div className="xl:col-span-9 space-y-4">
              {/* Split Screen Views */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
                 {/* Original Text */}
                 <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-200/60 pb-2">
                       <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Original Content (English)</span>
                       <a href={baseArticle?.original_url} target="_blank" rel="noreferrer" className="text-[10px] text-orange-600 hover:underline">View Source</a>
                    </div>
                    <div className="overflow-y-auto flex-1 text-xs text-gray-600 ltr font-mono leading-relaxed space-y-3">
                       <h1 className="font-bold text-gray-900 text-sm">{baseArticle?.title}</h1>
                       {loadingDetail ? <p className="animate-pulse">Loading content...</p> : <p>{fullContent}</p>}
                    </div>
                 </div>

                 {/* Translated & Rich Editor */}
                 <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                       <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5" /> ویرایشگر متن غنی (Rich Text)
                       </span>
                    </div>
                    <div className="overflow-y-auto flex-1 text-sm text-gray-800 leading-loose text-justify space-y-3">
                       <input 
                         type="text" 
                         value={currentTitle} 
                         onChange={(e) => handleApplyTitle(e.target.value)}
                         className="w-full font-bold text-gray-900 text-lg border-b border-transparent hover:border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                         placeholder="عنوان ترجمه شده..."
                       />
                       {loadingDetail ? (
                         <div className="animate-pulse text-gray-400">Loading translation...</div>
                       ) : (
                         <textarea 
                           defaultValue={fullTranslatedContent || ''}
                           onChange={(e) => {
                             if (!selectedArticleId) return;
                             setDetailsMap(prev => ({
                               ...prev,
                               [selectedArticleId]: {
                                 ...prev[selectedArticleId],
                                 translated_content: e.target.value
                               }
                             }));
                           }}
                           className="w-full h-full min-h-[250px] resize-none border-transparent hover:border-gray-200 focus:border-orange-500 focus:outline-none transition-colors rounded-lg p-2"
                           placeholder="متن ترجمه شده مقاله..."
                         ></textarea>
                       )}
                    </div>
                 </div>
              </div>

              {/* AI SEO Assistant & Media Fetcher */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 shadow-xs">
                    <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 mb-3">
                       <Wand2 className="w-4 h-4 text-indigo-600" /> دستیار سئوی هوش مصنوعی (AI SEO)
                    </h4>
                    <div className="space-y-3">
                       <div>
                          <span className="text-[10px] text-indigo-500 font-bold block mb-1">پیشنهاد عنوان جذاب (Clickbait / SEO)</span>
                          {suggestedTitles.length > 0 ? (
                            <div className="space-y-1.5">
                              {suggestedTitles.map((titleText, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <div className="flex-1 bg-white border border-indigo-100 rounded-lg px-3 py-1.5 text-xs text-gray-700">
                                    {titleText}
                                  </div>
                                  <button 
                                    onClick={() => handleApplyTitle(titleText)}
                                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
                                  >
                                    استفاده
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                               <div className="flex-1 bg-white border border-indigo-100 rounded-lg px-3 py-1.5 text-xs text-gray-500 italic">
                                  عنوانی توسط هوش مصنوعی پیشنهاد نشده است
                               </div>
                            </div>
                          )}
                       </div>
                       <div>
                          <span className="text-[10px] text-indigo-500 font-bold block mb-1">کلمات کلیدی پیشنهادی (Tags)</span>
                          <div className="flex gap-1.5 flex-wrap">
                             {tags.length > 0 ? (
                               tags.map((tagText, i) => (
                                 <span key={i} className="bg-white border border-indigo-100 text-indigo-800 text-[10px] px-2.5 py-0.5 rounded-full font-medium">
                                   #{tagText}
                                 </span>
                               ))
                             ) : (
                               <span className="text-[10px] text-gray-400 italic">بدون برچسب</span>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                       <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 mb-3">
                          <ImageIcon className="w-4 h-4 text-orange-500" /> مدیریت تصویر شاخص
                       </h4>
                       <div className="aspect-video bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden relative group">
                          {featuredImage ? (
                            <img 
                              src={featuredImage} 
                              alt={baseArticle?.title || 'Featured'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button className="text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-lg cursor-pointer">
                               {featuredImage ? 'تغییر تصویر شاخص' : 'تولید تصویر با AI'}
                             </button>
                          </div>
                       </div>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                       {publishStatus && (
                         <div className="text-[11px] font-bold text-center p-2 rounded-lg bg-gray-50 border border-gray-200">
                           {publishStatus}
                         </div>
                       )}
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={handleDistribute}
                            disabled={isPublishing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 w-full justify-center"
                          >
                             {isPublishing ? (
                               <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                             ) : (
                               <Send className="w-3.5 h-3.5" />
                             )}
                             <span>{isPublishing ? 'در حال انتشار...' : 'انتشار در وردپرس و تلگرام'}</span>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// 3. Editorial Collaboration (ابزارهای کار تیمی)
export const EditorialCollabTab: React.FC<{ news: JoinedArticleNews[] }> = ({ news }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
         <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                ابزارهای کار تیمی و کنترل کیفیت
              </h3>
              <p className="text-xs text-gray-500 mt-1">تخصیص وظایف، یادداشت‌گذاری و بررسی ضریب اطمینان ترجمه هوش مصنوعی.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Assignment */}
            <div className="lg:col-span-2 space-y-3">
               <h4 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2">کارتابل اعضای تیم</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">م۱</div>
                     <div>
                        <p className="text-xs font-bold text-gray-900">مترجم الف (تکنولوژی)</p>
                        <p className="text-[10px] text-gray-500 mt-1">۱۲ خبر در کارتابل منتظر بررسی</p>
                     </div>
                  </div>
                  <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs shrink-0">م۲</div>
                     <div>
                        <p className="text-xs font-bold text-gray-900">مترجم ب (اقتصاد)</p>
                        <p className="text-[10px] text-gray-500 mt-1">۵ خبر در کارتابل منتظر بررسی</p>
                     </div>
                  </div>
               </div>

               <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-700 mb-3">آخرین یادداشت‌های سردبیری (Editorial Notes)</h4>
                  <div className="space-y-2">
                     <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                        <div className="flex justify-between items-center mb-1.5">
                           <span className="font-bold text-gray-800 flex items-center gap-1.5"><MessageSquare className="w-3 h-3 text-orange-500" /> خبر: عرضه آیفون ۱۸</span>
                           <span className="text-[10px] text-gray-400">۱۰ دقیقه پیش</span>
                        </div>
                        <p className="text-gray-600">این خبر نیاز به بررسی اصطلاحات تخصصی دارد، لطفاً مدیر فنی چک کند.</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Confidence Score Panel */}
            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-xl p-4 shadow-inner">
               <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-4">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> امتیاز اطمینان AI (Confidence Score)
               </h4>
               <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                  هوش مصنوعی میزان اطمینان خود از صحت ترجمه را نشان می‌دهد. اخباری که زیر ۸۰٪ هستند با رنگ زرد مشخص شده‌اند و نیاز به دقت بیشتری دارند.
               </p>

               <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-lg shadow-xs">
                     <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">خبر توافق تجاری...</span>
                     <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width: '98%'}}></div></div>
                        <span className="text-[10px] font-bold text-emerald-600">۹۸٪</span>
                     </div>
                  </div>
                  <div className="flex items-center justify-between bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg shadow-xs">
                     <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">تحلیل پیچیده کوانتومی...</span>
                     <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{width: '65%'}}></div></div>
                        <span className="text-[10px] font-bold text-amber-600">۶۵٪</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

// 4. Deep Archive & Versioning (بایگانی عمیق)
export const DeepArchiveTab: React.FC<{ news: JoinedArticleNews[] }> = ({ news }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
         <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-orange-600" />
                بایگانی عمیق و تاریخچه (Deep Archive & Versioning)
              </h3>
              <p className="text-xs text-gray-500 mt-1">جستجوی چندوجهی در تمامی اخبار سیستم و کنترل نسخه ترجمه‌ها.</p>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="جستجو در آرشیو..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none" />
               </div>
               <button className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2 rounded-xl transition-colors">
                  <Filter className="w-4 h-4" />
               </button>
            </div>
         </div>

         {/* Versioning Example */}
         <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-orange-400"></div>
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mb-2">
               <History className="w-4 h-4 text-orange-600" /> کنترل نسخه ترجمه (Translation History)
            </h4>
            <p className="text-[10px] text-gray-500 mb-3">سیستم نسخه‌های قبلی ترجمه را نگه می‌دارد. در صورت نیاز می‌توانید به نسخه‌های قبل بازگردید.</p>
            
            <div className="flex items-center gap-4 text-xs">
               <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-xs flex-1 text-gray-500 line-through">
                  ترجمه اولیه (هوش مصنوعی - دیروز)
               </div>
               <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
               <div className="bg-white border border-orange-200 px-3 py-2 rounded-lg shadow-xs flex-1 text-gray-900 font-bold border-r-2 border-r-orange-500">
                  ویرایش نهایی (توسط سردبیر - امروز)
               </div>
               <button className="text-[10px] text-orange-600 bg-orange-100 hover:bg-orange-200 px-2 py-1.5 rounded font-bold transition-colors">Undo (بازگشت)</button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
               <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                     <th className="py-3 px-4 font-bold rounded-tr-lg">عنوان خبر</th>
                     <th className="py-3 px-4 font-bold">منبع</th>
                     <th className="py-3 px-4 font-bold">تاریخ انتشار</th>
                     <th className="py-3 px-4 font-bold">وضعیت انتشار</th>
                     <th className="py-3 px-4 font-bold rounded-tl-lg">مدل AI</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {news.slice(0, 5).map((s) => (
                     <tr key={s.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-bold text-gray-900 max-w-[250px] truncate">{s.translated_title || s.title}</td>
                        <td className="py-3 px-4 text-gray-500 font-mono text-[10px]">{s.source_id}</td>
                        <td className="py-3 px-4 text-gray-500">{new Date(s.published_at || s.created_at).toLocaleDateString('fa-IR')}</td>
                        <td className="py-3 px-4">
                           {s.translation_status === 'completed' ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">منتشر شده</span>
                           ) : (
                              <span className="text-[10px] text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded">در حال پردازش</span>
                           )}
                        </td>
                        <td className="py-3 px-4 text-[10px] text-gray-400 font-mono">GPT-4o</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
