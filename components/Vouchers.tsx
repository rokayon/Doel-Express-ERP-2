
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Voucher } from '../types';
import { Language } from '../translations';

interface VouchersProps {
  vouchers: Voucher[];
  onAdd: (voucher: Voucher) => void;
  onUpdate: (id: string, updates: Partial<Voucher>) => void;
  onDelete: (id: string) => void;
  lang: Language;
  canWrite?: boolean;
  loading?: boolean;
}

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5MB — PDFs can't be compressed client-side, so cap size instead

const compressImage = (file: File, maxWidth = 1200, quality = 0.72): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no ctx')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const isPdf = (dataUri: string) => dataUri.startsWith('data:application/pdf');

const daysLeft = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const getImages = (v: Voucher): string[] => {
  if (v.images && v.images.length > 0) return v.images;
  if (v.image) return [v.image];
  return [];
};

const Vouchers: React.FC<VouchersProps> = ({ vouchers, onAdd, onUpdate, onDelete, lang, canWrite = true, loading = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [voucherName, setVoucherName] = useState('');
  const [voucherImages, setVoucherImages] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; name: string } | null>(null);
  const [showExpired, setShowExpired] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const displayVouchers = useMemo(() => {
    if (showExpired) return vouchers;
    return vouchers.filter(v => {
      const expiryDate = new Date(v.expiresAt);
      return expiryDate > new Date();
    });
  }, [vouchers, showExpired]);

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setCompressing(true);
    setUploadError(null);
    try {
      const results: string[] = [];
      for (const file of files) {
        if (file.type === 'application/pdf') {
          if (file.size > MAX_PDF_BYTES) {
            setUploadError(lang === 'en' ? `"${file.name}" exceeds 5MB PDF limit — skipped.` : `"${file.name}" 5MB সীমার বেশি — বাদ দেওয়া হয়েছে।`);
            continue;
          }
          results.push(await readAsDataUrl(file));
        } else if (file.type.startsWith('image/')) {
          try {
            results.push(await compressImage(file));
          } catch {
            results.push(await readAsDataUrl(file));
          }
        }
      }
      setVoucherImages(prev => [...prev, ...results]);
    } finally {
      setCompressing(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const removeImageAt = (idx: number) => {
    setVoucherImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherName.trim()) return;
    setSaving(true);

    if (editingId) {
      await onUpdate(editingId, {
        name: voucherName.trim(),
        image: voucherImages[0] || undefined,
        images: voucherImages.length > 0 ? voucherImages : undefined,
      });
    } else {
      const now = new Date().toISOString();
      const expires = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString();
      const newVoucher: Voucher = {
        id: `VCH-${Date.now()}`,
        name: voucherName.trim(),
        image: voucherImages[0] || undefined,
        images: voucherImages.length > 0 ? voucherImages : undefined,
        createdAt: now,
        expiresAt: expires,
      };
      await onAdd(newVoucher);
    }

    setSaving(false);
    resetModal();
  };

  const openAddModal = () => {
    setEditingId(null);
    setVoucherName('');
    setVoucherImages([]);
    setUploadError(null);
    setShowModal(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setEditingId(voucher.id);
    setVoucherName(voucher.name);
    setVoucherImages(getImages(voucher));
    setUploadError(null);
    setShowModal(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingId(null);
    setVoucherName('');
    setVoucherImages([]);
    setUploadError(null);
  };

  const openLightbox = (voucher: Voucher, index = 0) => {
    const images = getImages(voucher);
    if (images.length === 0) return;
    setLightbox({ images, index, name: voucher.name });
  };

  const showPrev = useCallback(() => {
    setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb);
  }, []);
  const showNext = useCallback(() => {
    setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, showPrev, showNext]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            {lang === 'en' ? 'Vouchers' : 'ভাউচারসমূহ'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'en'
              ? `${displayVouchers.length} ${showExpired ? 'total' : 'active'} · Auto-delete after 40 days`
              : `${displayVouchers.length} ${showExpired ? 'মোট' : 'সক্রিয়'} · ৪০ দিন পরে স্বয়ংক্রিয়ভাবে মুছে যাবে`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExpired(!showExpired)}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              showExpired
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {lang === 'en' ? 'Show Expired' : 'মেয়াদোত্তীর্ণ দেখান'}
          </button>
          {canWrite && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              <i className="fa-solid fa-plus"></i>
              {lang === 'en' ? 'Add' : 'যোগ করুন'}
            </button>
          )}
        </div>
      </div>

      {/* Auto-delete notice */}
      <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl">
        <i className="fa-solid fa-clock text-amber-500 text-lg flex-shrink-0"></i>
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
          {lang === 'en'
            ? 'Vouchers automatically expire and are deleted from the database 40 days after upload. Images are compressed before saving; PDFs are stored as-is (max 5MB).'
            : 'আপলোড করার ৪০ দিন পরে ভাউচার স্বয়ংক্রিয়ভাবে মুছে যাবে। ছবি কম্প্রেস করে সেভ হয়; PDF যেমন আছে তেমন সেভ হয় (সর্বোচ্চ ৫MB)।'}
        </p>
      </div>

      {/* Voucher Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden animate-pulse">
              <div className="w-full aspect-[3/2] bg-slate-100 dark:bg-slate-800"></div>
              <div className="p-5 space-y-3">
                <div className="h-3.5 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                <div className="h-2.5 w-1/3 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : displayVouchers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-600 text-4xl">
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div>
            <p className="font-black text-slate-400 text-lg">
              {lang === 'en' ? (showExpired ? 'No expired vouchers' : 'No active vouchers') : (showExpired ? 'কোনো মেয়াদোত্তীর্ণ ভাউচার নেই' : 'কোনো সক্রিয় ভাউচার নেই')}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {lang === 'en' ? 'Add a voucher to get started.' : 'শুরু করতে একটি ভাউচার যোগ করুন।'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayVouchers.map(voucher => {
            const remaining = daysLeft(voucher.expiresAt);
            const isExpiringSoon = remaining <= 7;
            const images = getImages(voucher);
            const cover = images[0];
            const coverIsPdf = cover ? isPdf(cover) : false;
            return (
              <div
                key={voucher.id}
                className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 transition-all duration-300 overflow-hidden"
              >
                {/* Voucher cover */}
                <div
                  className={`relative w-full aspect-[3/2] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 ${images.length > 0 ? 'cursor-zoom-in' : ''}`}
                  onClick={() => openLightbox(voucher, 0)}
                >
                  {cover ? (
                    coverIsPdf ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-rose-50 dark:bg-rose-900/10">
                        <i className="fa-solid fa-file-pdf text-5xl text-rose-500"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">PDF Document</span>
                      </div>
                    ) : (
                      <img src={cover} alt={voucher.name} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fa-solid fa-image text-4xl text-slate-300 dark:text-slate-600"></i>
                    </div>
                  )}
                  {/* Multi-file count badge */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-black bg-black/60 text-white flex items-center gap-1">
                      <i className="fa-solid fa-images"></i>{images.length}
                    </div>
                  )}
                  {/* Expiry badge */}
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    isExpiringSoon
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {isExpiringSoon
                      ? `${remaining}d left`
                      : `${remaining}d`}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <p className="font-black text-sm text-slate-900 dark:text-white truncate">{voucher.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                    {lang === 'en' ? 'Expires' : 'মেয়াদ শেষ'}:{' '}
                    {new Date(voucher.expiresAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </p>

                  {canWrite && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openEditModal(voucher)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all border border-blue-100 dark:border-blue-800/30 hover:border-blue-500"
                      >
                        <i className="fa-solid fa-pen text-[10px]"></i>
                        {lang === 'en' ? 'Edit' : 'সম্পাদনা'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(voucher.id)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-100 dark:border-rose-800/30 hover:border-rose-500"
                      >
                        <i className="fa-solid fa-trash text-[10px]"></i>
                        {lang === 'en' ? 'Delete' : 'মুছুন'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  {editingId
                    ? (lang === 'en' ? 'Edit Voucher' : 'ভাউচার সম্পাদনা')
                    : (lang === 'en' ? 'Add New Voucher' : 'নতুন ভাউচার যোগ করুন')}
                </h3>
                <p className="text-[10px] font-bold text-blue-200 mt-0.5 uppercase tracking-widest">
                  {editingId
                    ? (lang === 'en' ? 'Update name or files' : 'নাম বা ফাইল আপডেট করুন')
                    : (lang === 'en' ? 'Auto-expires in 40 days' : '৪০ দিন পরে স্বয়ংক্রিয়ভাবে মুছে যাবে')}
                </p>
              </div>
              <button onClick={resetModal} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              {/* Voucher Name */}
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                  {lang === 'en' ? 'Voucher Name' : 'ভাউচারের নাম'} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={voucherName}
                  onChange={e => setVoucherName(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. Eid Discount 20%' : 'যেমন: ঈদ ডিসকাউন্ট ২০%'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white hover:border-blue-400 dark:hover:border-blue-400"
                />
              </div>

              {/* Multi-format Upload */}
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                  {lang === 'en' ? 'Voucher Files' : 'ভাউচারের ফাইল'}{' '}
                  <span className="normal-case font-medium text-slate-400">{lang === 'en' ? '(images or PDF, multiple allowed)' : '(ছবি বা PDF, একাধিক)'}</span>
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  ref={imageInputRef}
                  onChange={handleImagesChange}
                  className="hidden"
                />

                {uploadError && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>{uploadError}
                  </div>
                )}

                {voucherImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {voucherImages.map((item, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                        {isPdf(item) ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-rose-50 dark:bg-rose-900/10">
                            <i className="fa-solid fa-file-pdf text-2xl text-rose-500"></i>
                            <span className="text-[8px] font-black text-rose-500 uppercase">PDF</span>
                          </div>
                        ) : (
                          <img src={item} alt={`preview ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeImageAt(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[8px] font-black bg-blue-600 text-white uppercase tracking-wide">Cover</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onClick={() => !compressing && imageInputRef.current?.click()}
                  className={`relative w-full rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden group border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400 ${voucherImages.length > 0 ? 'aspect-[4/1]' : 'aspect-[3/2]'}`}
                >
                  <div className="text-center py-6 px-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      {compressing ? (
                        <i className="fa-solid fa-spinner fa-spin text-blue-500 text-xl"></i>
                      ) : (
                        <i className="fa-solid fa-cloud-arrow-up text-blue-500 text-xl"></i>
                      )}
                    </div>
                    <p className="font-black text-slate-600 dark:text-slate-300 text-sm">
                      {compressing
                        ? (lang === 'en' ? 'Processing...' : 'প্রসেস হচ্ছে...')
                        : voucherImages.length > 0
                          ? (lang === 'en' ? 'Add more files' : 'আরও ফাইল যোগ করুন')
                          : (lang === 'en' ? 'Click to upload files' : 'ফাইল আপলোড করতে ক্লিক করুন')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                      {lang === 'en' ? 'JPG, PNG, WEBP — auto compressed · PDF up to 5MB' : 'JPG, PNG, WEBP — স্বয়ংক্রিয় কম্প্রেস · PDF সর্বোচ্চ ৫MB'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                >
                  {lang === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button
                  type="submit"
                  disabled={saving || compressing}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 transition-all text-sm disabled:opacity-60 active:scale-[0.98]"
                >
                  {saving ? (
                    <><i className="fa-solid fa-spinner fa-spin mr-2"></i>{lang === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}</>
                  ) : editingId ? (
                    <><i className="fa-solid fa-check mr-2"></i>{lang === 'en' ? 'Save Changes' : 'পরিবর্তন সংরক্ষণ'}</>
                  ) : (
                    <><i className="fa-solid fa-circle-plus mr-2"></i>{lang === 'en' ? 'Add Voucher' : 'ভাউচার যোগ করুন'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-5 text-rose-500 text-2xl">
              <i className="fa-solid fa-trash"></i>
            </div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white mb-2">
              {lang === 'en' ? 'Delete Voucher?' : 'ভাউচার মুছবেন?'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {lang === 'en'
                ? 'This will permanently remove the voucher and its files from the database.'
                : 'এটি ভাউচার এবং এর ফাইল ডেটাবেস থেকে স্থায়ীভাবে মুছে ফেলবে।'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
              >
                {lang === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                onClick={() => { onDelete(deleteConfirmId); setDeleteConfirmId(null); }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-600/20 transition-all text-sm active:scale-[0.98]"
              >
                <i className="fa-solid fa-trash mr-2 text-xs"></i>
                {lang === 'en' ? 'Delete' : 'মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox with prev/next gallery navigation — supports images and PDFs */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
        >
          {isPdf(lightbox.images[lightbox.index]) ? (
            <div className="w-[90vw] h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <iframe src={lightbox.images[lightbox.index]} title={lightbox.name} className="w-full h-full border-0" />
            </div>
          ) : (
            <img
              src={lightbox.images[lightbox.index]}
              alt={lightbox.name}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl cursor-zoom-out"
            />
          )}

          {lightbox.images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); showPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl transition-all"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button
                onClick={e => { e.stopPropagation(); showNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl transition-all"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-black tabular-nums">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            </>
          )}

          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl transition-all"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default Vouchers;
