
import React, { useState, useMemo } from 'react';
import { Trip, Transaction } from '../types';
import { Language, translations } from '../translations';

interface TicketingProps {
  trips: Trip[];
  onAddTransaction: (tx: Transaction) => void;
  lang: Language;
}

const Ticketing: React.FC<TicketingProps> = ({ trips, onAddTransaction, lang }) => {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const t = translations[lang];
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const [showConfirm, setShowConfirm] = useState(false);

  // BUG FIX: Stabilized seat layout using useMemo so statuses don't randomize on every state change.
  const seats = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: `${Math.floor(i/4) + 1}${['A', 'B', 'C', 'D'][i % 4]}`,
      // Use a fixed pseudo-randomness based on ID for visual stability
      status: (parseInt(selectedTripId.replace(/\D/g, '') || '0') + i) % 7 === 0 ? 'booked' : 'available'
    }));
  }, [selectedTripId]);

  const handleBooking = () => {
    const selectedTrip = trips.find(t => t.id === selectedTripId);
    if (!selectedTrip) return;

    const newTx: Transaction = {
      id: `BK-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Income',
      category: 'Ticket Sales',
      amount: 750,
      description: `Seat ${selectedSeat} - ${selectedTrip.route}`
    };
    
    onAddTransaction(newTx);
    setSelectedSeat(null);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t.ticketing}</h2>
        {showConfirm && (
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 animate-bounce">
            <i className="fa-solid fa-circle-check"></i> Booking Successful!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold mb-4 flex items-center gap-2"><i className="fa-solid fa-bus text-emerald-500"></i> {lang === 'en' ? 'Select Trip' : 'ট্রিপ নির্বাচন'}</h3>
            <div className="space-y-4">
              {trips.map(trip => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedTripId === trip.id 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-emerald-300'
                  }`}
                >
                  <p className="font-bold text-sm">{trip.route}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{trip.busNumber}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">{trip.capacity - trip.bookedSeats} Left</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">{lang === 'en' ? 'Bus Floor Plan' : 'বাসের আসন পরিকল্পনা'}</h3>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-dashed border-slate-300">
             <div className="max-w-xs mx-auto">
                <div className="grid grid-cols-4 gap-4">
                  {seats.map(seat => (
                    <button
                      key={seat.id}
                      disabled={seat.status === 'booked'}
                      onClick={() => setSelectedSeat(seat.id)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        seat.status === 'booked' ? 'bg-slate-500 text-white cursor-not-allowed' : 
                        selectedSeat === seat.id ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border'
                      } ${seat.id.endsWith('B') ? 'mr-8' : ''}`}
                    >
                      {seat.id}
                    </button>
                  ))}
                </div>
             </div>
          </div>
          {selectedSeat && (
            <div className="mt-8 flex justify-between items-center p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl animate-in slide-in-from-bottom-2">
              <div><p className="text-sm font-bold text-emerald-800">Seat {selectedSeat} • ৳ 750.00</p></div>
              <button onClick={handleBooking} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold">PAY & BOOK</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ticketing;
