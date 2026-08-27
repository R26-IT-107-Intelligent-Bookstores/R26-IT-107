"use client";

export const dynamic = 'force-dynamic';
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, CreditCard, BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const title = searchParams?.get('title') || "Book Order";
  const price = searchParams?.get('price') || "0.00";

  const [isPaid, setIsPaid] = useState(false);

  const handlePayNow = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaid(true);
    // මෙතනින් Mock Payment එක සාර්ථකයි කියලා පෙන්නලා තත්පර කීපයකින් Home එකට යවන්න පුළුවන්
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 py-12 px-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        
        <Link href="/" className="inline-flex items-center gap-2.5 text-teal-800 cursor-pointer hover:opacity-90 transition-opacity mb-6">
          <div className="bg-teal-800 p-2 rounded-lg shadow-sm">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Intelligent Bookstore</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-6 h-6 text-teal-700" />
            <h1 className="text-2xl font-extrabold text-gray-900">Secure Checkout</h1>
          </div>
          <p className="text-gray-500 text-sm mb-6">Intelligent Bookstore Mock Payment Gateway</p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">පොත:</span>
              <span className="font-bold text-gray-800">{title}</span>
            </div>
            <div className="flex justify-between text-base border-t pt-2">
              <span className="font-medium text-gray-700">ගෙවිය යුතු මුදල:</span>
              <span className="font-black text-teal-800">Rs. {parseFloat(price).toFixed(2)}</span>
            </div>
          </div>

          {isPaid ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-lg">ගෙවීම සාර්ථකයි! (Payment Successful)</h3>
              <p className="text-xs text-emerald-700">TrendStock Inventory එක ස්වයංක්‍රීයව යාවත්කාලීන විය.</p>
              <button 
                onClick={() => router.push("/")}
                className="mt-4 bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-800 transition-colors w-full"
              >
                මුල් පිටුවට යන්න
              </button>
            </div>
          ) : (
            <form onSubmit={handlePayNow} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cardholder Name</label>
                <input type="text" required placeholder="Nirmani" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-teal-600 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Card Number</label>
                <input type="text" required placeholder="4242 •••• •••• 4242" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-teal-600 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expiry Date</label>
                  <input type="text" required placeholder="MM/YY" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-teal-600 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">CVV</label>
                  <input type="password" required placeholder="123" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-teal-600 text-sm" />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base mt-2"
              >
                <ShieldCheck className="w-5 h-5" /> Pay Now (Rs. {parseFloat(price).toFixed(2)})
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}