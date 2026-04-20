// src/lib/store.tsx
'use client';

import React, {
  createContext, useContext, useCallback,
  useState, useEffect, useRef,
} from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Property, FinancialConfig, Development,
  AffordableApplication, AffordableUpdate,
} from '@/types';

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_FIN: FinancialConfig = {
  savings: 0, htb: 0,
  aip1Bank: '', aip1Value: 0,
  aip2Bank: '', aip2Value: 0,
  interestRate: 4, termYears: 30,
  netMonthlyIncome: 0,
};

function migrateProperty(p: Property): Property {
  return {
    houseType: '', developmentId: undefined,
    brochureUrl: undefined, imageUrl: undefined,
    isAffordableScheme: false, affordableData: undefined,
    ...p,
  };
}

// ─── Context type ────────────────────────────────────────────────────────────

interface StoreCtx {
  properties: Property[];
  fin: FinancialConfig;
  developments: Development[];
  affordableApplications: AffordableApplication[];
  loaded: boolean;
  error: string | null;

  addProperty: (p: Omit<Property, 'id' | 'createdAt'>) => Promise<void>;
  updateProperty: (p: Property) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setFin: (f: FinancialConfig) => Promise<void>;
  addDevelopment: (d: Omit<Development, 'id' | 'createdAt'>) => Promise<void>;
  updateDevelopment: (d: Development) => Promise<void>;
  deleteDevelopment: (id: string) => Promise<void>;
  addAffordableApplication: (propertyId: string, applicationDate: string) => Promise<void>;
  deleteAffordableApplication: (id: string) => Promise<void>;
  updateApplicationDate: (applicationId: string, date: string) => Promise<void>;
  addAffordableUpdate: (appId: string, u: Omit<AffordableUpdate, 'id' | 'createdAt'>) => Promise<void>;
  updateAffordableUpdate: (appId: string, u: AffordableUpdate) => Promise<void>;
  deleteAffordableUpdate: (appId: string, updateId: string) => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [properties,             setProperties]             = useState<Property[]>([]);
  const [developments,           setDevelopments]           = useState<Development[]>([]);
  const [fin,                    setFinState]               = useState<FinancialConfig>(DEFAULT_FIN);
  const [affordableApplications, setAffordableApplications] = useState<AffordableApplication[]>([]);
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [propsRes, devsRes, finRes, affRes] = await Promise.all([
          supabase.from('properties').select('id, data').order('created_at', { ascending: false }),
          supabase.from('developments').select('id, data').order('created_at', { ascending: false }),
          supabase.from('financial_config').select('data').eq('singleton', 'main').maybeSingle(),
          supabase.from('affordable_applications').select('id, data').order('created_at', { ascending: false }),
        ]);

        if (propsRes.error) throw propsRes.error;
        if (devsRes.error)  throw devsRes.error;
        if (finRes.error)   throw finRes.error;
        if (affRes.error)   throw affRes.error;

        setProperties((propsRes.data ?? []).map(r => migrateProperty({ ...r.data, id: r.id })));
        setDevelopments((devsRes.data ?? []).map(r => ({ ...r.data, id: r.id })));
        setFinState(finRes.data ? { ...DEFAULT_FIN, ...finRes.data.data } : DEFAULT_FIN);
        setAffordableApplications((affRes.data ?? []).map(r => ({ ...r.data, id: r.id })));
      } catch (e: any) {
        setError(e?.message ?? 'Erro ao carregar dados');
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  // ── Properties ──────────────────────────────────────────────────────────────

  const addProperty = useCallback(async (p: Omit<Property, 'id' | 'createdAt'>) => {
    const newProp: Property = {
      houseType: '', isAffordableScheme: false, ...p,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setProperties(prev => [newProp, ...prev]);
    const { error } = await supabase
      .from('properties')
      .insert({ id: newProp.id, data: newProp });
    if (error) setError(error.message);
  }, []);

  const updateProperty = useCallback(async (p: Property) => {
    setProperties(prev => prev.map(x => x.id === p.id ? p : x));
    const { error } = await supabase
      .from('properties')
      .update({ data: p, updated_at: new Date().toISOString() })
      .eq('id', p.id);
    if (error) setError(error.message);
  }, []);

  const deleteProperty = useCallback(async (id: string) => {
    setProperties(prev => prev.filter(x => x.id !== id));
    setAffordableApplications(prev => prev.filter(a => a.propertyId !== id));
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) setError(error.message);
    // Also delete linked affordable applications
    await supabase
      .from('affordable_applications')
      .delete()
      .filter('data->>propertyId', 'eq', id);
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const updated = properties.map(x => x.id === id ? { ...x, favorite: !x.favorite } : x);
    setProperties(updated);
    const prop = updated.find(x => x.id === id);
    if (prop) {
      const { error } = await supabase
        .from('properties')
        .update({ data: prop, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) setError(error.message);
    }
  }, [properties]);

  // ── Financial config ─────────────────────────────────────────────────────────

  const setFin = useCallback(async (f: FinancialConfig) => {
    setFinState(f);
    const { error } = await supabase
      .from('financial_config')
      .upsert({ singleton: 'main', data: f, updated_at: new Date().toISOString() },
               { onConflict: 'singleton' });
    if (error) setError(error.message);
  }, []);

  // ── Developments ─────────────────────────────────────────────────────────────

  const addDevelopment = useCallback(async (d: Omit<Development, 'id' | 'createdAt'>) => {
    const newDev: Development = { ...d, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setDevelopments(prev => [newDev, ...prev]);
    const { error } = await supabase.from('developments').insert({ id: newDev.id, data: newDev });
    if (error) setError(error.message);
  }, []);

  const updateDevelopment = useCallback(async (d: Development) => {
    setDevelopments(prev => prev.map(x => x.id === d.id ? d : x));
    const { error } = await supabase
      .from('developments')
      .update({ data: d, updated_at: new Date().toISOString() })
      .eq('id', d.id);
    if (error) setError(error.message);
  }, []);

  const deleteDevelopment = useCallback(async (id: string) => {
    const unlinked = properties.map(p =>
      p.developmentId === id ? { ...p, developmentId: undefined } : p
    );
    setProperties(unlinked);
    setDevelopments(prev => prev.filter(x => x.id !== id));
    // Unlink properties in DB
    await Promise.all(
      unlinked
        .filter(p => !p.developmentId && properties.find(o => o.id === p.id)?.developmentId === id)
        .map(p => supabase.from('properties').update({ data: p }).eq('id', p.id))
    );
    const { error } = await supabase.from('developments').delete().eq('id', id);
    if (error) setError(error.message);
  }, [properties]);

  // ── Affordable Applications ───────────────────────────────────────────────────

  const addAffordableApplication = useCallback(async (propertyId: string, applicationDate: string) => {
    const newApp: AffordableApplication = {
      id: crypto.randomUUID(),
      propertyId, applicationDate,
      updates: [],
      createdAt: new Date().toISOString(),
    };
    setAffordableApplications(prev => [newApp, ...prev]);
    const { error } = await supabase
      .from('affordable_applications')
      .insert({ id: newApp.id, data: newApp });
    if (error) setError(error.message);
  }, []);

  const deleteAffordableApplication = useCallback(async (id: string) => {
    setAffordableApplications(prev => prev.filter(a => a.id !== id));
    const { error } = await supabase.from('affordable_applications').delete().eq('id', id);
    if (error) setError(error.message);
  }, []);

  const updateApplicationDate = useCallback(async (applicationId: string, date: string) => {
    const updated = affordableApplications.map(a =>
      a.id === applicationId ? { ...a, applicationDate: date } : a
    );
    setAffordableApplications(updated);
    const app = updated.find(a => a.id === applicationId);
    if (app) {
      const { error } = await supabase
        .from('affordable_applications')
        .update({ data: app, updated_at: new Date().toISOString() })
        .eq('id', applicationId);
      if (error) setError(error.message);
    }
  }, [affordableApplications]);

  const _saveApp = useCallback(async (app: AffordableApplication) => {
    const { error } = await supabase
      .from('affordable_applications')
      .update({ data: app, updated_at: new Date().toISOString() })
      .eq('id', app.id);
    if (error) setError(error.message);
  }, []);

  const addAffordableUpdate = useCallback(async (
    appId: string,
    u: Omit<AffordableUpdate, 'id' | 'createdAt'>
  ) => {
    const newUpdate: AffordableUpdate = {
      ...u, id: crypto.randomUUID(), createdAt: new Date().toISOString(),
    };
    const updated = affordableApplications.map(a =>
      a.id === appId
        ? { ...a, updates: [...a.updates, newUpdate].sort((x, y) => x.date.localeCompare(y.date)) }
        : a
    );
    setAffordableApplications(updated);
    const app = updated.find(a => a.id === appId);
    if (app) await _saveApp(app);
  }, [affordableApplications, _saveApp]);

  const updateAffordableUpdate = useCallback(async (appId: string, u: AffordableUpdate) => {
    const updated = affordableApplications.map(a =>
      a.id === appId
        ? { ...a, updates: a.updates.map(x => x.id === u.id ? u : x).sort((x, y) => x.date.localeCompare(y.date)) }
        : a
    );
    setAffordableApplications(updated);
    const app = updated.find(a => a.id === appId);
    if (app) await _saveApp(app);
  }, [affordableApplications, _saveApp]);

  const deleteAffordableUpdate = useCallback(async (appId: string, updateId: string) => {
    const updated = affordableApplications.map(a =>
      a.id === appId ? { ...a, updates: a.updates.filter(u => u.id !== updateId) } : a
    );
    setAffordableApplications(updated);
    const app = updated.find(a => a.id === appId);
    if (app) await _saveApp(app);
  }, [affordableApplications, _saveApp]);

  return (
    <Ctx.Provider value={{
      properties, fin, developments, affordableApplications, loaded, error,
      addProperty, updateProperty, deleteProperty, toggleFavorite,
      setFin,
      addDevelopment, updateDevelopment, deleteDevelopment,
      addAffordableApplication, deleteAffordableApplication, updateApplicationDate,
      addAffordableUpdate, updateAffordableUpdate, deleteAffordableUpdate,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
