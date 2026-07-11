
import React, { useState, useRef, useMemo } from 'react';
import { Voucher } from '../types';
import { Language } from '../translations';

interface VouchersProps {
  vouchers: Voucher[];
  onAdd: (voucher: Voucher) => void;
  onDelete: (id: string) => void;
  lang: Language;
  canWrite?: boolean;
}

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

const daysLeft = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const Vouchers: React.FC<VouchersProps> = ({ vouchers, onAdd, onDelete, lang, canWrite = true }) => {
  const [showModal, setShowModal] = useState(false);
  const [voucherName, setVoucherName] = useState('');
  const [voucherImage, setVoucherImage] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeVouchers = useMemo(
    () => vouchers.filter(v => new Date(v.expiresAt) > new Date()),
    [vouchers]
  );

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setVoucherImage(compressed);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => setVoucherImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherName.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString();
    const newVoucher: Voucher = {
      id: `VCH-${Date.now()}`,
      name: voucherName.trim(),
      image: voucherImage || undefined,
      createdAt: now,
      expiresAt: expires,
    };
    await onAdd(newVoucher);
    setSaving(false);
    setShowModal(false);
    setVoucherName('');
    setVoucherImage('');
  };

  const resetModal = () => {
    setShowModal(false);
    setVoucherName('');
    setVoucherImage('');
  };

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
              ? `${activeVouchers.length} active · Auto-delete after 40 days`
              : `${activeVouchers.length}টি সক্রিয় · ৪০ দিন পরে স্বয়ংক্রিয়ভাবে মুছে যাবে`}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            <i className="fa-solid fa-plus"></i>
            {lang === 'en' ? 'Add Voucher' : 'ভাউচার যোগ করুন'}
          </button>
        )}
      </div>

      {/* Auto-delete notice */}
      <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl">
        <i className="fa-solid fa-clock text-amber-500 text-lg flex-shrink-0"></i>
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
          {lang === 'en'
            ? 'Vouchers automatically expire and are deleted from the database 40 days after upload. Images are compressed before saving to conserve storage.'
            : 'আপলোড করার ৪০ দিন পরে ভাউচার স্বয়ংক্রিয়ভাবে মুছে যাবে। ছবি কম্প্রেস করে সেভ করা হয়।'}
        </p>
      </div>

      {/* Voucher Grid */}
      {activeVouchers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-600 text-4xl">
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div>
            <p className="font-black text-slate-400 text-lg">
              {lang === 'en' ? 'No vouchers yet' : 'এখনো কোনো ভাউচার নেই'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {lang === 'en' ? 'Add a voucher to get started.' : 'শুরু করতে একটি ভাউচার যোগ করুন।'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeVouchers.map(voucher => {
            const remaining = daysLeft(voucher.expiresAt);
            const isExpiringSoon = remaining <= 7;
            return (
              <div
                key={voucher.id}
                className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 transition-all duration-300 overflow-hidden"
              >
                {/* Voucher image */}
                <div
                  className={`relative w-full aspect-[3/2] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 ${voucher.image ? 'cursor-zoom-in' : ''}`}
                  onClick={() => voucher.image && setLightboxImg(voucher.image)}
                >
                  {voucher.image ? (
                    <img
                      src={voucher.image}
                      alt={voucher.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fa-solid fa-image text-4xl text-slate-300 dark:text-slate-600"></i>
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
                    <button
                      onClick={() => setDeleteConfirmId(voucher.id)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition-all border border-rose-100 dark:border-rose-800/30 hover:border-rose-500"
                    >
                      <i className="fa-solid fa-trash text-[10px]"></i>
                      {lang === 'en' ? 'Delete Voucher' : 'মুছে ফেলুন'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  {lang === 'en' ? 'Add New Voucher' : 'নতুন ভাউচার যোগ করুন'}
                </h3>
                <p className="text-[10px] font-bold text-blue-200 mt-0.5 uppercase tracking-widest">
                  {lang === 'en' ? 'Auto-expires in 40 days' : '৪০ দিন পরে স্বয়ংক্রিয়ভাবে মুছে যাবে'}
                </p>
              </div>
              <button onClick={resetModal} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

              {/* Image Upload */}
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                  {lang === 'en' ? 'Voucher Image' : 'ভাউচারের ছবি'}{' '}
                  <span className="normal-case font-medium text-slate-400">{lang === 'en' ? '(optional)' : '(ঐচ্ছিক)'}</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className={`relative w-full aspect-[3/2] rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                    voucherImage
                      ? 'border-blue-500 border-solid'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400'
                  }`}
                >
                  {voucherImage ? (
                    <>
                      <img src={voucherImage} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-blue-600/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-black text-sm gap-2 transition-opacity">
                        <i className="fa-solid fa-rotate"></i>
                        {lang === 'en' ? 'Change Image' : 'ছবি পরিবর্তন করুন'}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 px-4">
                      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <i className="fa-solid fa-cloud-arrow-up text-blue-500 text-2xl"></i>
                      </div>
                      <p className="font-black text-slate-600 dark:text-slate-300 text-sm">
                        {lang === 'en' ? 'Click to upload image' : 'ছবি আপলোড করতে ক্লিক করুন'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                        {lang === 'en' ? 'JPG, PNG — auto compressed' : 'JPG, PNG — স্বয়ংক্রিয় কম্প্রেস'}
                      </p>
                    </div>
                  )}
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
                  disabled={saving}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 transition-all text-sm disabled:opacity-60 active:scale-[0.98]"
                >
                  {saving ? (
                    <><i className="fa-solid fa-spinner fa-spin mr-2"></i>{lang === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}</>
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
                ? 'This will permanently remove the voucher and its image from the database.'
                : 'এটি ভাউচার এবং এর ছবি ডেটাবেস থেকে স্থায়ীভাবে মুছে ফেলবে।'}
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

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Voucher"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
          <button
            onClick={() => setLightboxImg(null)}
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
