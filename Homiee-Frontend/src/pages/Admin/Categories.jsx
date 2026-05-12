import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Boxes, 
  Pencil, 
  ShoppingBag, 
  Users, 
  Search, 
  Plus,
  ShieldCheck,
  Check,
  X,
  Layers,
  ArrowUpRight,
  Eye,
  EyeOff,
  Trash2,
  Save,
  Undo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SurfaceCard from '../../components/SurfaceCard';
import StatePanel from '../../components/StatePanel';
import { createAdminCategory, getAdminCategories, toggleAdminCategory, updateAdminCategory } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import { getResponseData } from '../../utils/api';

export default function Categories() {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });

  const allCategories = getResponseData(data) ?? [];
  const categories = allCategories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

  const createMutation = useMutation({
    mutationFn: () => createAdminCategory({ name }),
    onSuccess: (response) => { setName(''); refresh(); toast.success(response.message || 'Taxonomy branch added.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to add branch.'),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAdminCategory(editingId, { name: editingName }),
    onSuccess: (response) => { setEditingId(null); setEditingName(''); refresh(); toast.success(response.message || 'Taxonomy branch updated.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update branch.'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleAdminCategory,
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Visibility toggled.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to toggle visibility.'),
  });

  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary-dark)] text-white text-[10px] font-bold uppercase tracking-widest mb-6">
            <Layers size={14} /> Platform Taxonomy
          </div>
          <h1 className="text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">
            The <i className="text-[var(--color-accent)]">Categories.</i>
          </h1>
          <p className="mt-4 text-xl text-[var(--color-text-muted)] font-medium max-w-2xl">
            Define the conceptual architecture of the marketplace through curated categories and collections.
          </p>
        </div>
      </header>

      {/* advanced creation bar */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-xl border border-[var(--color-stone)]/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Search existing taxonomy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-5 rounded-2xl bg-[var(--color-sand)]/20 border-transparent focus:bg-white focus:border-[var(--color-accent)] transition-all outline-none font-medium text-[var(--color-primary-dark)]"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-96 relative">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New Category Name..."
              className="w-full pl-6 pr-12 py-5 rounded-2xl bg-[var(--color-forest-light)]/20 border-transparent focus:bg-white focus:border-[var(--color-primary)] transition-all outline-none font-bold text-[var(--color-primary-dark)]"
            />
            <button 
              onClick={() => createMutation.mutate()} 
              disabled={!name.trim() || createMutation.isPending}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[var(--color-primary-dark)] text-white flex items-center justify-center hover:bg-[var(--color-accent)] transition-all disabled:opacity-30"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Taxonomy Registry */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[2.5rem] bg-[var(--color-sand)]/20" />
            ))}
          </div>
        ) : error ? (
          <StatePanel
            className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[2.5rem]"
            message={(
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-primary-dark)] mb-4">The taxonomy failed to synchronize.</p>
                <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
              </div>
            )}
          />
        ) : categories.length === 0 ? (
          <SurfaceCard className="bg-white border-[var(--color-stone)]/10 text-center py-24 rounded-[3rem]">
            <Boxes size={64} className="mx-auto text-[var(--color-sand)] mb-6" />
            <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{search ? 'No Matches' : 'The Taxonomy is Empty'}</h3>
            <p className="mt-2 text-[var(--color-text-muted)] font-medium">Add a new branch above to begin organizing the Homiee marketplace.</p>
          </SurfaceCard>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-6">
              {categories.map((category, idx) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <SurfaceCard className="bg-white border-[var(--color-stone)]/5 shadow-xl hover:shadow-2xl hover:border-[var(--color-accent)]/20 transition-all rounded-[2.5rem] p-6 group">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      {/* Branch Identity */}
                      <div className="flex items-center gap-6 flex-1 min-w-0 w-full">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors ${category.isActive ? 'bg-[var(--color-forest-light)]/20 text-[var(--color-primary)]' : 'bg-stone-100 text-stone-400 opacity-50'}`}>
                          {category.isActive ? <Check size={24} /> : <X size={24} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingId === category.id ? (
                            <div className="flex items-center gap-4">
                              <input 
                                value={editingName} 
                                onChange={(event) => setEditingName(event.target.value)} 
                                className="w-full max-w-md px-6 py-4 rounded-2xl bg-[var(--color-sand)]/20 border-2 border-[var(--color-accent)] outline-none font-bold text-xl text-[var(--color-primary-dark)]" 
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <span className={`text-2xl font-['Fraunces'] font-semibold transition-colors ${category.isActive ? 'text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)]' : 'text-stone-400 italic'}`}>
                                {category.name}
                              </span>
                              {!category.isActive && (
                                <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                                  Archived
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Control Suite */}
                      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                        {editingId === category.id ? (
                          <>
                            <button 
                              onClick={() => updateMutation.mutate()} 
                              disabled={updateMutation.isPending}
                              className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Save Changes"
                            >
                              <Save size={20} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="w-12 h-12 rounded-2xl bg-stone-50 text-stone-500 flex items-center justify-center hover:bg-stone-500 hover:text-white transition-all shadow-sm"
                              title="Discard"
                            >
                              <Undo2 size={20} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(category.id);
                                setEditingName(category.name);
                              }}
                              className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)] flex items-center justify-center hover:bg-[var(--color-primary-dark)] hover:text-white transition-all shadow-sm"
                              title="Edit Branch"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => toggleMutation.mutate(category.id)} 
                              disabled={toggleMutation.isPending}
                              className={`px-8 py-4 rounded-2xl font-bold text-sm transition-all ${
                                category.isActive 
                                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' 
                                  : 'bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-accent)]'
                              }`}
                            >
                              {category.isActive ? 'Archive branch' : 'Restore branch'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </SurfaceCard>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
