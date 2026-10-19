"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { cleanList, emptyRequest, parseRequest } from "@/lib/emobooks/data";
import { getCatalog } from "@/lib/emobooks/catalogApi";
import type { Book, RecommendationRequest } from "@/lib/emobooks/types";

type State = {
  request: RecommendationRequest;
  updateRequest: (update: Partial<RecommendationRequest>) => void;
  savedIds: string[];
  toggleSaved: (id: string) => void;
  ready: boolean;
  storageNotice: string;
  catalog: Book[];
  catalogGenres: string[];
  catalogLoading: boolean;
  catalogError: string;
  refreshCatalog: () => void;
  catalogRevision: number;
};
const Context = createContext<State | null>(null);

export default function EmoBooksProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<RecommendationRequest>(emptyRequest);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const [catalog, setCatalog] = useState<Book[]>([]);
  const [catalogGenres, setCatalogGenres] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [catalogRevision, setCatalogRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setCatalogRevision((value) => value + 1);
    const onStorage = (event: StorageEvent) => { if (event.key === "emobooks:catalog-updated") refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    window.addEventListener("emobooks:catalog-updated", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("emobooks:catalog-updated", refresh);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    getCatalog("", 1, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setCatalog(data.books); setCatalogGenres(data.genres); setCatalogError(""); setCatalogLoading(false);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setCatalogError(error instanceof Error ? error.message : "The book catalog could not be loaded."); setCatalogLoading(false);
    });
    return () => controller.abort();
  }, [catalogRevision]);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setRequest(parseRequest(JSON.parse(sessionStorage.getItem("emobooks:request:v1") ?? "null")));
        const saved: unknown = JSON.parse(localStorage.getItem("emobooks:saved:v1") ?? "[]");
        setSavedIds(cleanList(saved, 1000, 100));
      } catch {
        setStorageNotice("Browser storage is unavailable or was reset. You can still use EmoBooks in this visit.");
      }
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem("emobooks:request:v1", JSON.stringify(request));
      localStorage.setItem("emobooks:saved:v1", JSON.stringify(savedIds));
    } catch {
      queueMicrotask(() => setStorageNotice("Your choices work for this visit, but this browser cannot save them after a refresh."));
    }
  }, [ready, request, savedIds]);

  return <Context.Provider value={{ request, savedIds, ready, storageNotice,
    catalog, catalogGenres, catalogLoading, catalogError, catalogRevision,
    refreshCatalog: () => { setCatalogLoading(true); setCatalogRevision((value) => value + 1); },
    updateRequest: (update) => setRequest((previous) => ({ ...previous, ...update })),
    toggleSaved: (id) => setSavedIds((previous) => previous.includes(id) ? previous.filter((saved) => saved !== id) : [...previous, id]),
  }}>{children}</Context.Provider>;
}

export function useEmoBooks() {
  const context = useContext(Context);
  if (!context) throw new Error("EmoBooksProvider is required.");
  return context;
}
