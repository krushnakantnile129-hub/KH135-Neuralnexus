"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { User, Deal, MerchantKyc } from '@/shared/types';
import { subscribeAuth, updateUserProfile, updateMerchantKyc } from '@/lib/auth-store';
import { loadDeals, updateDealDetails, loadStores } from '@/lib/store';
import { 
  User as UserIcon, 
  Store as StoreIcon, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Edit3, 
  Package, 
  FileCheck, 
  Building, 
  CreditCard, 
  MapPin, 
  Sparkles,
  Phone,
  Layers,
  ShoppingBag
} from 'lucide-react';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'BUSINESS' | 'PRODUCTS'>('PROFILE');
  const [successMsg, setSuccessMsg] = useState('');

  // Consumer Profile Form State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  // Merchant Business Info Form State
  const [businessName, setBusinessName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [fssai, setFssai] = useState('');
  const [gstin, setGstin] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Merchant Catalog Product Management State
  const [merchantDeals, setMerchantDeals] = useState<Deal[]>([]);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editRemainingUnits, setEditRemainingUnits] = useState(0);
  const [editOriginalPrice, setEditOriginalPrice] = useState(0);
  const [editPublishedPrice, setEditPublishedPrice] = useState(0);
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeAuth((u) => {
      setCurrentUser(u);
      if (u) {
        setName(u.name || '');
        setBio(u.bio || '');
        if (u.kycData) {
          setBusinessName(u.kycData.accountHolder || u.name);
          setStreetAddress(u.kycData.streetAddress || '');
          setCity(u.kycData.city || 'Pune');
          setState(u.kycData.state || 'Maharashtra');
          setFssai(u.kycData.fssaiLicense || '');
          setGstin(u.kycData.gstin || '');
          setBankName(u.kycData.bankName || '');
          setAccountHolder(u.kycData.accountHolder || u.name);
          setAccountNumber(u.kycData.accountNumber || '');
          setIfscCode(u.kycData.ifscCode || '');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const refreshDeals = () => {
    const all = loadDeals();
    setMerchantDeals(all);
  };

  useEffect(() => {
    refreshDeals();
  }, []);

  const handleSaveConsumerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUserProfile({
      name: name.trim(),
      bio: bio.trim(),
    });

    setSuccessMsg('Profile details updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveBusinessInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    updateUserProfile({ name: name.trim() });
    updateMerchantKyc({
      streetAddress,
      city,
      state,
      fssaiLicense: fssai,
      gstin,
      bankName,
      accountHolder,
      accountNumber,
      ifscCode,
    });

    setSuccessMsg('Business info & tax details updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleStartEditDeal = (deal: Deal) => {
    setEditingDealId(deal.id);
    setEditProductName(deal.productName);
    setEditRemainingUnits(deal.remainingUnits);
    setEditOriginalPrice(deal.originalPrice);
    setEditPublishedPrice(deal.publishedPrice);
    setEditDescription(deal.description || '');
  };

  const handleSaveDealDetails = (dealId: string) => {
    updateDealDetails(dealId, {
      productName: editProductName,
      remainingUnits: editRemainingUnits,
      originalPrice: editOriginalPrice,
      publishedPrice: editPublishedPrice,
      description: editDescription,
    });

    setEditingDealId(null);
    refreshDeals();
    setSuccessMsg('Surplus product listing updated live across platform feeds!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl mx-auto">
              👤
            </div>
            <h1 className="text-xl font-bold text-zinc-900">Sign In Required</h1>
            <p className="text-xs text-zinc-500">Please sign in to access your profile and business dashboard.</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Return to Home Page
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isShopkeeper = currentUser.role === 'SHOPKEEPER';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Profile Header Banner */}
        <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-2xl shadow-md overflow-hidden shrink-0">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900">{currentUser.name}</h1>
                <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded ${
                  currentUser.role === 'SHOPKEEPER' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                  currentUser.role === 'ADMIN' ? 'bg-zinc-900 text-white' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentUser.role === 'SHOPKEEPER' ? 'Verified Merchant' : currentUser.role}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{currentUser.email}</p>
              {currentUser.bio && (
                <p className="text-xs text-zinc-600 mt-1 italic max-w-lg">&ldquo;{currentUser.bio}&rdquo;</p>
              )}
            </div>
          </div>

          {/* Role Status Pill */}
          {currentUser.role === 'SHOPKEEPER' && (
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div>FSSAI Licensed Merchant</div>
                <div className="text-[10px] font-normal text-emerald-700">MH Registration Active</div>
              </div>
            </div>
          )}
        </section>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Navigation for Shopkeeper vs Consumer */}
        {isShopkeeper ? (
          <div className="flex bg-zinc-200/80 p-1 rounded-2xl text-xs font-bold max-w-md">
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                activeTab === 'PROFILE' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Public Profile
            </button>
            <button
              onClick={() => setActiveTab('BUSINESS')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                activeTab === 'BUSINESS' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Account &amp; Business Info
            </button>
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                activeTab === 'PRODUCTS' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Catalog &amp; Product Manager
            </button>
          </div>
        ) : null}

        {/* TAB 1: CONSUMER / USER PROFILE EDITING */}
        {(activeTab === 'PROFILE' || !isShopkeeper) && (
          <form onSubmit={handleSaveConsumerProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <span>Personal Profile Settings</span>
              </h2>
              <p className="text-xs text-zinc-500">Edit your public display name and bio</p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Public Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Public Bio &amp; Rescue Preferences</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell nearby bakeries and cafes about your surplus food preferences..."
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Updates</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: SHOPKEEPER BUSINESS & TAX INFO EDITING */}
        {activeTab === 'BUSINESS' && isShopkeeper && (
          <form onSubmit={handleSaveBusinessInfo} className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-blue-600" />
                <span>Registered Business Info &amp; Tax Compliance (Amazon-Style Merchant Profile)</span>
              </h2>
              <p className="text-xs text-zinc-500">Manage registered business address, FSSAI license, GSTIN, and payout bank details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business & Address Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Store &amp; Location Details</h3>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Legal Business Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border rounded-xl focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border rounded-xl focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">State (Restricted to MH)</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-100 border rounded-xl font-bold text-blue-900"
                    />
                  </div>
                </div>
              </div>

              {/* Regulatory & Bank Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Tax, Safety &amp; Bank Settlement</h3>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">FSSAI Food Safety License Number</label>
                  <input
                    type="text"
                    value={fssai}
                    onChange={(e) => setFssai(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border rounded-xl font-mono focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Registered GSTIN Tax ID</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border rounded-xl font-mono uppercase focus:bg-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border rounded-xl focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border rounded-xl font-mono uppercase focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border rounded-xl font-mono focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Business &amp; Tax Info</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: MERCHANT LIVE PRODUCT CATALOG MANAGER */}
        {activeTab === 'PRODUCTS' && isShopkeeper && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Live Product Catalog &amp; Inventory Manager</span>
                </h2>
                <p className="text-xs text-zinc-500">Edit product names, stock quantities, original/clearance prices, and descriptions in real time</p>
              </div>

              <Link
                href="/merchant/add-deal"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
              >
                + Catalog New Batch
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Product Name</th>
                    <th className="p-3">Remaining Stock</th>
                    <th className="p-3">Original Price</th>
                    <th className="p-3">Clearance Price</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {merchantDeals.map((deal) => {
                    const isEditing = editingDealId === deal.id;
                    return (
                      <tr key={deal.id} className="hover:bg-zinc-50/50">
                        <td className="p-3 font-bold text-zinc-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editProductName}
                              onChange={(e) => setEditProductName(e.target.value)}
                              className="px-2 py-1 border rounded text-xs w-full"
                            />
                          ) : (
                            deal.productName
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editRemainingUnits}
                              onChange={(e) => setEditRemainingUnits(parseInt(e.target.value) || 0)}
                              className="px-2 py-1 border rounded text-xs w-20"
                            />
                          ) : (
                            `${deal.remainingUnits} units`
                          )}
                        </td>
                        <td className="p-3 font-mono text-zinc-400 line-through">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editOriginalPrice}
                              onChange={(e) => setEditOriginalPrice(parseInt(e.target.value) || 0)}
                              className="px-2 py-1 border rounded text-xs w-20"
                            />
                          ) : (
                            `₹${deal.originalPrice}`
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editPublishedPrice}
                              onChange={(e) => setEditPublishedPrice(parseInt(e.target.value) || 0)}
                              className="px-2 py-1 border rounded text-xs w-20"
                            />
                          ) : (
                            `₹${deal.publishedPrice}`
                          )}
                        </td>
                        <td className="p-3 text-zinc-500 max-w-xs truncate">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="px-2 py-1 border rounded text-xs w-full"
                            />
                          ) : (
                            deal.description || 'Fresh end-of-day surplus'
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveDealDetails(deal.id)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] shadow-sm"
                            >
                              Save Live
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEditDeal(deal)}
                              className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg font-bold text-[11px] flex items-center gap-1 ml-auto"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
